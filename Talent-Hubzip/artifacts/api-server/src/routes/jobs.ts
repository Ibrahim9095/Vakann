import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, jobsTable, companiesTable } from "@workspace/db";
import { getCurrentUser, requireAuth } from "../lib/auth";
import { enqueueJobSocialPosts } from "../lib/social/queue";
import { getSocialPostsForJob } from "../lib/social/queue";
import { recomputeForJob } from "../lib/matching/service";

const router: IRouter = Router();

router.get("/jobs", async (req, res): Promise<void> => {
  const { category, city, employmentType, salaryMin, salaryMax, search, companyId, page = "1", limit = "20" } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  // HR şirkət paneli: bütün vakansiyalar (aktiv + deaktiv). İctimai siyahı: yalnız aktiv.
  let allJobs = companyId
    ? await db.select().from(jobsTable)
    : (await db.select().from(jobsTable).where(eq(jobsTable.isActive, true))).filter(j => !j.isSuspendedByAdmin);

  if (category) allJobs = allJobs.filter(j => j.category === category);
  if (city) allJobs = allJobs.filter(j => j.city === city);
  if (employmentType) allJobs = allJobs.filter(j => j.employmentType === employmentType);
  if (salaryMin) allJobs = allJobs.filter(j => j.salaryMax != null && j.salaryMax >= parseInt(salaryMin as string, 10));
  if (salaryMax) allJobs = allJobs.filter(j => j.salaryMin != null && j.salaryMin <= parseInt(salaryMax as string, 10));
  if (companyId) allJobs = allJobs.filter(j => j.companyId === parseInt(companyId as string, 10));
  if (search) {
    const s = (search as string).toLowerCase();
    allJobs = allJobs.filter(j => j.title.toLowerCase().includes(s) || (j.description ?? "").toLowerCase().includes(s));
  }

  const allCompanies = await db.select().from(companiesTable);
  const companyMap = new Map(allCompanies.map(c => [c.id, c]));

  allJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = allJobs.length;
  const start = (pageNum - 1) * limitNum;
  const data = allJobs.slice(start, start + limitNum).map(j => ({
    ...j,
    company: companyMap.get(j.companyId) ?? null,
  }));

  res.json({ data, total, page: pageNum, limit: limitNum });
});

router.get("/jobs/stats", async (_req, res): Promise<void> => {
  const allJobs = await db.select().from(jobsTable).where(eq(jobsTable.isActive, true));

  const byCategory = new Map<string, number>();
  const byCity = new Map<string, number>();
  const byEmploymentType = new Map<string, number>();

  for (const job of allJobs) {
    byCategory.set(job.category, (byCategory.get(job.category) ?? 0) + 1);
    if (job.city) byCity.set(job.city, (byCity.get(job.city) ?? 0) + 1);
    byEmploymentType.set(job.employmentType, (byEmploymentType.get(job.employmentType) ?? 0) + 1);
  }

  res.json({
    totalJobs: allJobs.length,
    byCategory: [...byCategory.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    byCity: [...byCity.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    byEmploymentType: [...byEmploymentType.entries()].map(([label, count]) => ({ label, count })),
  });
});

router.post("/jobs", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (user.role !== "hr" && user.role !== "admin") {
    res.status(403).json({ error: "Only HR users can post jobs" });
    return;
  }

  const companies = await db.select().from(companiesTable).where(eq(companiesTable.userId, user.id));
  if (companies.length === 0) {
    res.status(400).json({ error: "No company profile found. Create a company first." });
    return;
  }
  const company = companies[0];

  const { title, category, description, requirements, city, address, employmentType, salaryMin, salaryMax, currency,
    requiresVoiceIntro, voicePrompt, requiresNearbyLocation, jobLat, jobLng, radiusKm,
    requiresHealthDeclaration, requiresCreditDeclaration } = req.body;
  if (!title || !category) { res.status(400).json({ error: "title and category are required" }); return; }

  const [job] = await db.insert(jobsTable).values({
    companyId: company.id,
    title,
    category,
    description,
    requirements,
    city,
    address,
    employmentType: employmentType ?? "full_time",
    salaryMin,
    salaryMax,
    currency: currency ?? "AZN",
    requiresVoiceIntro: requiresVoiceIntro ?? false,
    voicePrompt: voicePrompt ?? null,
    requiresNearbyLocation: requiresNearbyLocation ?? false,
    jobLat: jobLat ?? null,
    jobLng: jobLng ?? null,
    radiusKm: radiusKm ?? null,
    requiresHealthDeclaration: requiresHealthDeclaration ?? false,
    requiresCreditDeclaration: requiresCreditDeclaration ?? false,
  }).returning();

  enqueueJobSocialPosts(job.id).catch(() => {});
  recomputeForJob(job.id).catch(() => {});

  res.status(201).json({ ...job, company });
});

router.get("/jobs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id));
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  await db.update(jobsTable).set({ viewCount: job.viewCount + 1 }).where(eq(jobsTable.id, id));

  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, job.companyId));
  const socialPosts = await getSocialPostsForJob(id);
  res.json({ ...job, company: company ?? null, socialPosts });
});

router.patch("/jobs/:id", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id));
  if (!job) { res.status(404).json({ error: "Not found" }); return; }

  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, job.companyId));
  if (!company || (company.userId !== user.id && user.role !== "admin")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const updateData: Partial<typeof jobsTable.$inferInsert> = {};
  const fields = [
    "title","category","description","requirements","city","address","employmentType","salaryMin","salaryMax","currency","isActive",
    "requiresVoiceIntro","voicePrompt","requiresNearbyLocation","jobLat","jobLng","radiusKm",
    "requiresHealthDeclaration","requiresCreditDeclaration",
  ];
  for (const field of fields) {
    if (req.body[field] !== undefined) (updateData as Record<string, unknown>)[field] = req.body[field];
  }

  const [updated] = await db.update(jobsTable).set(updateData).where(eq(jobsTable.id, id)).returning();
  recomputeForJob(id).catch(() => {});
  res.json({ ...updated, company: company ?? null });
});

router.delete("/jobs/:id", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id));
  if (!job) { res.status(404).json({ error: "Not found" }); return; }

  // Only the company owner or admin can delete
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, job.companyId));
  if (!company || (company.userId !== user.id && user.role !== "admin")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.update(jobsTable).set({ isActive: false }).where(eq(jobsTable.id, id));
  res.json({ success: true });
});

router.post("/jobs/:id/share", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id));
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, job.companyId));
  if (!company || (company.userId !== user.id && user.role !== "admin")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const channels = Array.isArray(req.body?.channels) ? req.body.channels : undefined;
  enqueueJobSocialPosts(job.id, channels).catch(() => {});
  res.json({ success: true });
});

export default router;
