import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, applicationsTable, jobsTable, candidatesTable, companiesTable } from "@workspace/db";
import { getCurrentUser, requireAuth } from "../lib/auth";
import { notifyUser } from "../lib/notifications/service";

const router: IRouter = Router();

async function enrichApplication(app: typeof applicationsTable.$inferSelect) {
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, app.jobId));
  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, app.candidateId));
  let company = null;
  if (job) {
    const [c] = await db.select().from(companiesTable).where(eq(companiesTable.id, job.companyId));
    company = c ?? null;
  }
  return { ...app, job: job ? { ...job, company } : null, candidate: candidate ?? null };
}

router.get("/applications", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { jobId, candidateId, status } = req.query;

  let all = await db.select().from(applicationsTable);

  if (user.role === "candidate") {
    // Candidates only see their own applications
    const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.userId, user.id));
    if (!candidate) { res.json([]); return; }
    all = all.filter(a => a.candidateId === candidate.id);
  } else if (user.role === "hr") {
    // HR sees applications for their own company's jobs
    const companies = await db.select().from(companiesTable).where(eq(companiesTable.userId, user.id));
    const companyIds = companies.map(c => c.id);
    const hrJobs = await db.select().from(jobsTable);
    const hrJobIds = hrJobs.filter(j => companyIds.includes(j.companyId)).map(j => j.id);
    all = all.filter(a => hrJobIds.includes(a.jobId));
  }
  // admin sees all

  if (jobId) all = all.filter(a => a.jobId === parseInt(jobId as string, 10));
  if (candidateId) all = all.filter(a => a.candidateId === parseInt(candidateId as string, 10));
  if (status) all = all.filter(a => a.status === status);

  const enriched = await Promise.all(all.map(enrichApplication));
  res.json(enriched);
});

router.post("/applications", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (user.role === "hr") {
    res.status(403).json({ error: "HR users cannot apply to jobs" });
    return;
  }

  const { jobId, coverLetter, voiceApplicationUrl, voiceDurationSec } = req.body;
  if (!jobId) { res.status(400).json({ error: "jobId is required" }); return; }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }

  if (job.requiresVoiceIntro && !voiceApplicationUrl) {
    res.status(400).json({ error: "Voice application is required for this job" });
    return;
  }

  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.userId, user.id));
  if (!candidate) {
    res.status(400).json({ error: "Namizəd profili tapılmadı. Əvvəlcə profilinizi yaradın." });
    return;
  }

  const existing = await db.select().from(applicationsTable)
    .where(and(eq(applicationsTable.jobId, jobId), eq(applicationsTable.candidateId, candidate.id)));
  if (existing.length > 0) {
    res.status(400).json({ error: "Bu vakansiyaya artıq müraciət etmisiniz." });
    return;
  }

  const [application] = await db.insert(applicationsTable).values({
    jobId,
    candidateId: candidate.id,
    coverLetter,
    voiceApplicationUrl: voiceApplicationUrl ?? null,
    voiceDurationSec: voiceDurationSec ?? null,
    status: "pending",
  }).returning();

  // Increment job application count
  const [currentJob] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (currentJob) {
    await db.update(jobsTable).set({ applicationCount: currentJob.applicationCount + 1 }).where(eq(jobsTable.id, jobId));
  }

  const enriched = await enrichApplication(application);
  res.status(201).json(enriched);
});

router.get("/applications/:id", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id));
  if (!app) { res.status(404).json({ error: "Not found" }); return; }

  // Only owner candidate or HR of that job's company or admin
  if (user.role === "candidate") {
    const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.userId, user.id));
    if (!candidate || candidate.id !== app.candidateId) { res.status(403).json({ error: "Forbidden" }); return; }
  } else if (user.role === "hr") {
    const companies = await db.select().from(companiesTable).where(eq(companiesTable.userId, user.id));
    const companyIds = companies.map(c => c.id);
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, app.jobId));
    if (!job || !companyIds.includes(job.companyId)) { res.status(403).json({ error: "Forbidden" }); return; }
  }

  res.json(await enrichApplication(app));
});

router.patch("/applications/:id", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (user.role !== "hr" && user.role !== "admin") {
    res.status(403).json({ error: "Only HR can update application status" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id));
  if (!app) { res.status(404).json({ error: "Not found" }); return; }

  // Verify HR owns the job
  if (user.role === "hr") {
    const companies = await db.select().from(companiesTable).where(eq(companiesTable.userId, user.id));
    const companyIds = companies.map(c => c.id);
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, app.jobId));
    if (!job || !companyIds.includes(job.companyId)) { res.status(403).json({ error: "Forbidden" }); return; }
  }

  const { status } = req.body;
  const [updated] = await db.update(applicationsTable).set({ status }).where(eq(applicationsTable.id, id)).returning();

  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, app.candidateId));
  if (candidate && status) {
    await notifyUser({
      userId: candidate.userId,
      type: "application_status",
      title: "Müraciət statusu yeniləndi",
      body: `Müraciətinizin yeni statusu: ${status}`,
      payload: { applicationId: id, status },
    });
  }

  res.json(await enrichApplication(updated));
});

export default router;
