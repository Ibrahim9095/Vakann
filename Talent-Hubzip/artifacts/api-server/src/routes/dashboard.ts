import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, jobsTable, applicationsTable, contactRequestsTable, candidatesTable, companiesTable, subscriptionsTable, ratingsTable } from "@workspace/db";
import { getCurrentUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/hr-summary", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const companies = await db.select().from(companiesTable).where(eq(companiesTable.userId, user.id));
  const companyIds = companies.map(c => c.id);

  let totalJobs = 0, activeJobs = 0;
  let recentJobs: typeof jobsTable.$inferSelect[] = [];

  if (companyIds.length > 0) {
    const allJobs = await db.select().from(jobsTable).where(eq(jobsTable.companyId, companyIds[0]));
    totalJobs = allJobs.length;
    activeJobs = allJobs.filter(j => j.isActive).length;
    recentJobs = allJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);
  }

  const allContactRequests = await db.select().from(contactRequestsTable).where(eq(contactRequestsTable.hrUserId, user.id));
  const totalContactRequests = allContactRequests.length;
  const acceptedContactRequests = allContactRequests.filter(cr => cr.status === "accepted").length;

  // Get applications for HR's jobs
  let totalApplications = 0, pendingApplications = 0;
  let recentApplications: typeof applicationsTable.$inferSelect[] = [];
  if (companyIds.length > 0) {
    const allJobs = await db.select().from(jobsTable).where(eq(jobsTable.companyId, companyIds[0]));
    const jobIds = allJobs.map(j => j.id);
    if (jobIds.length > 0) {
      const apps = await db.select().from(applicationsTable);
      const hrApps = apps.filter(a => jobIds.includes(a.jobId));
      totalApplications = hrApps.length;
      pendingApplications = hrApps.filter(a => a.status === "pending").length;
      recentApplications = hrApps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);
    }
  }

  res.json({
    totalJobs,
    activeJobs,
    totalApplications,
    pendingApplications,
    totalContactRequests,
    acceptedContactRequests,
    recentJobs: recentJobs.map(j => ({ ...j, company: companies[0] ?? null })),
    recentApplications,
  });
});

router.get("/dashboard/candidate-summary", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.userId, user.id));
  if (!candidate) {
    res.json({ totalApplications: 0, pendingApplications: 0, totalContactRequests: 0, profileViews: 0, subscriptionStatus: "free", subscriptionExpiresAt: null, recentContactRequests: [], recentApplications: [] });
    return;
  }

  const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.candidateId, candidate.id));
  const totalApplications = apps.length;
  const pendingApplications = apps.filter(a => a.status === "pending").length;
  const recentApplications = apps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);

  const contactRequests = await db.select().from(contactRequestsTable).where(eq(contactRequestsTable.candidateId, candidate.id));
  const totalContactRequests = contactRequests.length;
  const recentCRs = contactRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);

  const enrichedCRs = await Promise.all(recentCRs.map(async (cr) => {
    const companies = await db.select().from(companiesTable).where(eq(companiesTable.userId, cr.hrUserId));
    return { ...cr, candidate, company: companies[0] ?? null };
  }));

  const now = new Date();
  const tier = candidate.subscriptionTier;
  const isActive =
    tier === "vip" ||
    (tier === "time_limited" && candidate.subscriptionExpiresAt && candidate.subscriptionExpiresAt > now);

  res.json({
    totalApplications,
    pendingApplications,
    totalContactRequests,
    profileViews: candidate.profileViews,
    subscriptionStatus: isActive ? "active" : tier,
    subscriptionTier: tier,
    subscriptionExpiresAt: candidate.subscriptionExpiresAt,
    recentContactRequests: enrichedCRs,
    recentApplications,
  });
});

router.get("/dashboard/recent-activity", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const limit = parseInt((req.query.limit as string) ?? "10", 10);
  const items: { id: number; type: string; title: string; description: string | null; createdAt: Date }[] = [];

  if (user.role === "hr") {
    const companies = await db.select().from(companiesTable).where(eq(companiesTable.userId, user.id));
    const companyIds = companies.map(c => c.id);

    if (companyIds.length > 0) {
      const jobs = await db.select().from(jobsTable).where(eq(jobsTable.companyId, companyIds[0]));
      for (const j of jobs.slice(0, 3)) {
        items.push({ id: j.id, type: "job_posted", title: `Vakansiya: ${j.title}`, description: j.category, createdAt: j.createdAt });
      }
    }

    const crs = await db.select().from(contactRequestsTable).where(eq(contactRequestsTable.hrUserId, user.id));
    for (const cr of crs.slice(0, 3)) {
      items.push({ id: cr.id, type: "contact_request", title: "Namizəd ilə əlaqə sorğusu", description: cr.status, createdAt: cr.createdAt });
    }
  } else {
    const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.userId, user.id));
    if (candidate) {
      const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.candidateId, candidate.id));
      for (const a of apps.slice(0, 3)) {
        items.push({ id: a.id, type: "application", title: "Vakansiyaya müraciət", description: a.status, createdAt: a.createdAt });
      }

      const crs = await db.select().from(contactRequestsTable).where(eq(contactRequestsTable.candidateId, candidate.id));
      for (const cr of crs.slice(0, 3)) {
        items.push({ id: cr.id, type: "contact_request", title: "HR-dan əlaqə sorğusu", description: cr.status, createdAt: cr.createdAt });
      }

      const subs = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, user.id));
      for (const s of subs.slice(0, 2)) {
        items.push({ id: s.id, type: "subscription", title: "Abunəlik aktivləşdirildi", description: s.status, createdAt: s.createdAt });
      }
    }
  }

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  res.json(items.slice(0, limit));
});

export default router;
