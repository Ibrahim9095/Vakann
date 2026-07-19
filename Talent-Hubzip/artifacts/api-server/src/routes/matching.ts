import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, jobsTable, companiesTable, candidatesTable } from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";
import {
  getJobMatches,
  getRecommendedJobsForCandidate,
} from "../lib/matching/service";
import { countMatchingCandidates } from "../lib/matching/score";
import { getCompanyMediaQuota, recordMediaView } from "../lib/hr-limits";

const router: IRouter = Router();

router.get("/jobs/:id/matches", async (req, res): Promise<void> => {
  const user = await requireRole(req, res, "hr");
  if (!user) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const jobId = parseInt(raw, 10);

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, job.companyId));
  if (!company || (company.userId !== user.id && user.role !== "admin")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const matches = await getJobMatches(jobId);
  res.json(matches);
});

router.get("/jobs/:id/match-count", async (req, res): Promise<void> => {
  const user = await requireRole(req, res, "hr");
  if (!user) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const jobId = parseInt(raw, 10);

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, job.companyId));
  if (!company || (company.userId !== user.id && user.role !== "admin")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const candidates = await db
    .select()
    .from(candidatesTable)
    .where(and(eq(candidatesTable.isActive, true), eq(candidatesTable.isSuspendedByAdmin, false)));

  const count = countMatchingCandidates(job, candidates);
  res.json({ jobId, count });
});

router.get("/candidates/me/recommended-jobs", async (req, res): Promise<void> => {
  const user = await requireRole(req, res, "candidate");
  if (!user) return;

  const matches = await getRecommendedJobsForCandidate(user.id);
  res.json(matches);
});

router.post("/candidates/:id/media-view", async (req, res): Promise<void> => {
  const user = await requireRole(req, res, "hr");
  if (!user) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const candidateId = parseInt(raw, 10);
  const { mediaType } = req.body as { mediaType?: string };

  if (!mediaType || !["voice", "video"].includes(mediaType)) {
    res.status(400).json({ error: "mediaType must be voice or video" });
    return;
  }

  const companies = await db.select().from(companiesTable).where(eq(companiesTable.userId, user.id));
  if (companies.length === 0) {
    res.status(400).json({ error: "No company profile" });
    return;
  }

  const company = companies[0];
  const result = await recordMediaView(
    company.id,
    candidateId,
    user.id,
    mediaType as "voice" | "video",
  );

  if (!result.allowed) {
    res.status(402).json({
      error: "limit_exceeded",
      upgradeUrl: "/dashboard/hr/subscriptions",
      quota: result.quota,
    });
    return;
  }

  res.json({ allowed: true, quota: result.quota });
});

router.get("/companies/me/media-quota", async (req, res): Promise<void> => {
  const user = await requireRole(req, res, "hr");
  if (!user) return;

  const companies = await db.select().from(companiesTable).where(eq(companiesTable.userId, user.id));
  if (companies.length === 0) {
    res.status(404).json({ error: "No company profile" });
    return;
  }

  const quota = await getCompanyMediaQuota(companies[0].id);
  res.json(quota);
});

export default router;
