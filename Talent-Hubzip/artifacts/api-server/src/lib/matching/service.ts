import { eq, and, desc } from "drizzle-orm";
import {
  db,
  jobsTable,
  candidatesTable,
  jobMatchesTable,
  applicationsTable,
} from "@workspace/db";
import { computeMatchScore, MATCH_NOTIFY_THRESHOLD } from "./score";
import { notifyUser } from "../notifications/service";

export async function recomputeForJob(jobId: number): Promise<void> {
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job || !job.isActive) return;

  const candidates = await db
    .select()
    .from(candidatesTable)
    .where(and(eq(candidatesTable.isActive, true), eq(candidatesTable.isSuspendedByAdmin, false)));

  for (const candidate of candidates) {
    const { score, factors } = computeMatchScore(job, candidate);
    if (score < 20) continue;

    const [existing] = await db
      .select()
      .from(jobMatchesTable)
      .where(and(eq(jobMatchesTable.jobId, jobId), eq(jobMatchesTable.candidateId, candidate.id)));

    const shouldNotify = score >= MATCH_NOTIFY_THRESHOLD && !existing?.notifiedAt;

    if (existing) {
      await db
        .update(jobMatchesTable)
        .set({
          score,
          factors,
          ...(shouldNotify ? { notifiedAt: new Date() } : {}),
        })
        .where(eq(jobMatchesTable.id, existing.id));
    } else {
      await db.insert(jobMatchesTable).values({
        jobId,
        candidateId: candidate.id,
        score,
        factors,
        notifiedAt: shouldNotify ? new Date() : null,
      });
    }

    if (shouldNotify) {
      await notifyUser({
        userId: candidate.userId,
        type: "job_match",
        title: "Yeni uyğun vakansiya",
        body: `"${job.title}" vakansiyası profilinizə ${Math.round(score)}% uyğundur.`,
        payload: { jobId, candidateId: candidate.id, score },
      });
    }
  }
}

export async function recomputeForCandidate(candidateId: number): Promise<void> {
  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, candidateId));
  if (!candidate || !candidate.isActive) return;

  const jobs = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.isActive, true), eq(jobsTable.isSuspendedByAdmin, false)));

  for (const job of jobs) {
    const { score, factors } = computeMatchScore(job, candidate);
    if (score < 20) continue;

    const [existing] = await db
      .select()
      .from(jobMatchesTable)
      .where(and(eq(jobMatchesTable.jobId, job.id), eq(jobMatchesTable.candidateId, candidateId)));

    if (existing) {
      await db
        .update(jobMatchesTable)
        .set({ score, factors })
        .where(eq(jobMatchesTable.id, existing.id));
    } else {
      await db.insert(jobMatchesTable).values({
        jobId: job.id,
        candidateId,
        score,
        factors,
      });
    }
  }
}

export async function getJobMatches(jobId: number, limit = 50) {
  const matches = await db
    .select()
    .from(jobMatchesTable)
    .where(eq(jobMatchesTable.jobId, jobId))
    .orderBy(desc(jobMatchesTable.score));

  const top = matches.slice(0, limit);
  return Promise.all(
    top.map(async (m) => {
      const [candidate] = await db
        .select()
        .from(candidatesTable)
        .where(eq(candidatesTable.id, m.candidateId));
      return { ...m, candidate: candidate ?? null };
    }),
  );
}

export async function getRecommendedJobsForCandidate(userId: number, limit = 20) {
  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.userId, userId));
  if (!candidate) return [];

  const matches = await db
    .select()
    .from(jobMatchesTable)
    .where(eq(jobMatchesTable.candidateId, candidate.id))
    .orderBy(desc(jobMatchesTable.score));

  const top = matches.slice(0, limit);
  return Promise.all(
    top.map(async (m) => {
      const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, m.jobId));
      return { ...m, job: job ?? null };
    }),
  );
}

export async function getRecommendedJobsForCandidateProfile(candidateId: number, limit = 20) {
  const matches = await db
    .select()
    .from(jobMatchesTable)
    .where(eq(jobMatchesTable.candidateId, candidateId))
    .orderBy(desc(jobMatchesTable.score));

  const applied = await db.select().from(applicationsTable);
  const appliedJobIds = new Set(
    applied.filter((a) => {
      return a.candidateId === candidateId;
    }).map((a) => a.jobId),
  );

  const top = matches.filter((m) => !appliedJobIds.has(m.jobId)).slice(0, limit);
  return Promise.all(
    top.map(async (m) => {
      const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, m.jobId));
      return { ...m, job: job ?? null };
    }),
  );
}
