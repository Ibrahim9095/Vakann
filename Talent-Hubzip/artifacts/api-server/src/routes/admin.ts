import { Router, type IRouter } from "express";
import { eq, desc, count, and } from "drizzle-orm";
import {
  db, usersTable, jobsTable, candidatesTable, companiesTable,
  applicationsTable, subscriptionsTable, contactRequestsTable, ratingsTable,
  socialPostsTable,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { retrySocialPost } from "../lib/social/queue";

const router: IRouter = Router();

function requireAdmin(user: { role: string } | null, res: any): boolean {
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

// ── Stats ──────────────────────────────────────────────────────────────────────

router.get("/admin/stats", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (!requireAdmin(user, res)) return;

  const [totalUsers] = await db.select({ count: count() }).from(usersTable);
  const [totalJobs] = await db.select({ count: count() }).from(jobsTable);
  const [activeJobs] = await db.select({ count: count() }).from(jobsTable).where(eq(jobsTable.isActive, true));
  const [suspendedJobs] = await db.select({ count: count() }).from(jobsTable).where(eq(jobsTable.isSuspendedByAdmin, true));
  const [totalCandidates] = await db.select({ count: count() }).from(candidatesTable);
  const [suspendedCandidates] = await db.select({ count: count() }).from(candidatesTable).where(eq(candidatesTable.isSuspendedByAdmin, true));
  const [totalCompanies] = await db.select({ count: count() }).from(companiesTable);
  const [totalApplications] = await db.select({ count: count() }).from(applicationsTable);
  const [totalSubscriptions] = await db.select({ count: count() }).from(subscriptionsTable);
  const [bannedUsers] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.isBanned, true));

  res.json({
    totalUsers: totalUsers.count,
    bannedUsers: bannedUsers.count,
    totalJobs: totalJobs.count,
    activeJobs: activeJobs.count,
    suspendedJobs: suspendedJobs.count,
    totalCandidates: totalCandidates.count,
    suspendedCandidates: suspendedCandidates.count,
    totalCompanies: totalCompanies.count,
    totalApplications: totalApplications.count,
    totalSubscriptions: totalSubscriptions.count,
  });
});

// ── Users ──────────────────────────────────────────────────────────────────────

router.get("/admin/users", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (!requireAdmin(user, res)) return;

  const { role, search, page = "1", limit = "30" } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  let allUsers = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  if (role && role !== "all") allUsers = allUsers.filter(u => u.role === role);
  if (search) {
    const s = (search as string).toLowerCase();
    allUsers = allUsers.filter(u => u.fullName.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
  }

  const total = allUsers.length;
  const start = (pageNum - 1) * limitNum;
  const data = allUsers.slice(start, start + limitNum).map(u => ({
    ...u, passwordHash: undefined
  }));

  res.json({ data, total, page: pageNum, limit: limitNum });
});

router.patch("/admin/users/:id", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (!requireAdmin(user, res)) return;

  const id = parseInt(req.params.id, 10);
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }
  if (target.role === "admin") { res.status(400).json({ error: "Cannot modify admin users" }); return; }

  const allowed: Partial<typeof usersTable.$inferInsert> = {};
  if (req.body.isBanned !== undefined) allowed.isBanned = req.body.isBanned;
  if (req.body.role !== undefined && ["candidate", "hr"].includes(req.body.role)) allowed.role = req.body.role;

  const [updated] = await db.update(usersTable).set(allowed).where(eq(usersTable.id, id)).returning();
  const { passwordHash: _, ...safe } = updated;
  res.json(safe);
});

router.delete("/admin/users/:id", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (!requireAdmin(user, res)) return;

  const id = parseInt(req.params.id, 10);
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }
  if (target.role === "admin") { res.status(400).json({ error: "Cannot delete admin users" }); return; }

  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ success: true });
});

// ── Jobs ───────────────────────────────────────────────────────────────────────

router.get("/admin/jobs", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (!requireAdmin(user, res)) return;

  try {
    const { search, status, page = "1", limit = "30" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    let allJobs = await db.select().from(jobsTable).orderBy(desc(jobsTable.createdAt));
    const allCompanies = await db.select().from(companiesTable);
    const companyMap = new Map(allCompanies.map(c => [c.id, c]));

    if (status === "active") allJobs = allJobs.filter(j => j.isActive && !j.isSuspendedByAdmin);
    else if (status === "inactive") allJobs = allJobs.filter(j => !j.isActive);
    else if (status === "suspended") allJobs = allJobs.filter(j => j.isSuspendedByAdmin);

    if (search) {
      const s = (search as string).toLowerCase();
      allJobs = allJobs.filter(j => j.title.toLowerCase().includes(s));
    }

    const total = allJobs.length;
    const start = (pageNum - 1) * limitNum;
    const slice = allJobs.slice(start, start + limitNum);

    const data = await Promise.all(slice.map(async (j) => {
      // Dev-friendly: db:push edilməyibsə `social_posts` cədvəli olmaya bilər.
      let socialPosts: any[] = [];
      try {
        socialPosts = await db
          .select()
          .from(socialPostsTable)
          .where(eq(socialPostsTable.jobId, j.id));
      } catch {
        socialPosts = [];
      }

      return { ...j, company: companyMap.get(j.companyId) ?? null, socialPosts };
    }));

    res.json({ data, total, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error("GET /admin/jobs failed:", err);
    res.status(500).json({ error: "Failed to load jobs" });
  }
});

router.patch("/admin/jobs/:id", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (!requireAdmin(user, res)) return;

  const id = parseInt(req.params.id, 10);
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id));
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  const allowed: Partial<typeof jobsTable.$inferInsert> = {};
  if (req.body.isSuspendedByAdmin !== undefined) allowed.isSuspendedByAdmin = req.body.isSuspendedByAdmin;
  if (req.body.adminNote !== undefined) allowed.adminNote = req.body.adminNote;
  if (req.body.isActive !== undefined) allowed.isActive = req.body.isActive;

  const [updated] = await db.update(jobsTable).set(allowed).where(eq(jobsTable.id, id)).returning();
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, updated.companyId));
  res.json({ ...updated, company: company ?? null });
});

router.delete("/admin/jobs/:id", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (!requireAdmin(user, res)) return;

  const id = parseInt(req.params.id, 10);
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id));
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  await db.delete(applicationsTable).where(eq(applicationsTable.jobId, id));
  await db.delete(jobsTable).where(eq(jobsTable.id, id));
  res.json({ success: true });
});

router.post("/admin/social-posts/:id/retry", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (!requireAdmin(user, res)) return;

  const id = parseInt(req.params.id, 10);
  try {
    await retrySocialPost(id);
    const [post] = await db.select().from(socialPostsTable).where(eq(socialPostsTable.id, id));
    res.json(post ?? { success: true });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Retry failed" });
  }
});

// ── Candidates ─────────────────────────────────────────────────────────────────

router.get("/admin/candidates", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (!requireAdmin(user, res)) return;

  const { search, status, page = "1", limit = "30" } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  let allCandidates = await db.select().from(candidatesTable).orderBy(desc(candidatesTable.createdAt));
  const allUsers = await db.select().from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  if (status === "active") allCandidates = allCandidates.filter(c => c.isActive && !c.isSuspendedByAdmin);
  else if (status === "suspended") allCandidates = allCandidates.filter(c => c.isSuspendedByAdmin);
  else if (status === "inactive") allCandidates = allCandidates.filter(c => !c.isActive);

  if (search) {
    const s = (search as string).toLowerCase();
    allCandidates = allCandidates.filter(c => c.fullName.toLowerCase().includes(s) || c.category.toLowerCase().includes(s));
  }

  const total = allCandidates.length;
  const start = (pageNum - 1) * limitNum;
  const data = allCandidates.slice(start, start + limitNum).map(c => ({
    ...c,
    user: userMap.get(c.userId) ? { id: userMap.get(c.userId)!.id, email: userMap.get(c.userId)!.email, isBanned: userMap.get(c.userId)!.isBanned } : null
  }));

  res.json({ data, total, page: pageNum, limit: limitNum });
});

router.patch("/admin/candidates/:id", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (!requireAdmin(user, res)) return;

  const id = parseInt(req.params.id, 10);
  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, id));
  if (!candidate) { res.status(404).json({ error: "Candidate not found" }); return; }

  const allowed: Partial<typeof candidatesTable.$inferInsert> = {};
  if (req.body.isSuspendedByAdmin !== undefined) allowed.isSuspendedByAdmin = req.body.isSuspendedByAdmin;
  if (req.body.adminNote !== undefined) allowed.adminNote = req.body.adminNote;
  if (req.body.isActive !== undefined) allowed.isActive = req.body.isActive;

  const [updated] = await db.update(candidatesTable).set(allowed).where(eq(candidatesTable.id, id)).returning();
  res.json(updated);
});

// ── Companies ──────────────────────────────────────────────────────────────────

router.get("/admin/companies", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (!requireAdmin(user, res)) return;

  const { search, page = "1", limit = "30" } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  let allCompanies = await db.select().from(companiesTable).orderBy(desc(companiesTable.createdAt));
  const allUsers = await db.select().from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.id, u]));
  const allJobs = await db.select().from(jobsTable);
  const jobCountMap = new Map<number, number>();
  for (const j of allJobs) jobCountMap.set(j.companyId, (jobCountMap.get(j.companyId) ?? 0) + 1);

  if (search) {
    const s = (search as string).toLowerCase();
    allCompanies = allCompanies.filter(c => c.name.toLowerCase().includes(s));
  }

  const total = allCompanies.length;
  const start = (pageNum - 1) * limitNum;
  const data = allCompanies.slice(start, start + limitNum).map(c => ({
    ...c,
    jobCount: jobCountMap.get(c.id) ?? 0,
    hrUser: userMap.get(c.userId) ? {
      id: userMap.get(c.userId)!.id,
      email: userMap.get(c.userId)!.email,
      fullName: userMap.get(c.userId)!.fullName
    } : null
  }));

  res.json({ data, total, page: pageNum, limit: limitNum });
});

router.patch("/admin/companies/:id", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (!requireAdmin(user, res)) return;

  const id = parseInt(req.params.id, 10);
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, id));
  if (!company) { res.status(404).json({ error: "Company not found" }); return; }

  const allowed: Partial<typeof companiesTable.$inferInsert> = {};
  if (req.body.isVerified !== undefined) allowed.isVerified = req.body.isVerified;

  const [updated] = await db.update(companiesTable).set(allowed).where(eq(companiesTable.id, id)).returning();
  res.json(updated);
});

export default router;
