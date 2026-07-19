import { Router, type IRouter } from "express";
import { eq, count, and } from "drizzle-orm";
import { db, jobsTable, candidatesTable, companiesTable } from "@workspace/db";
import { getInterviewChancesCount } from "../lib/platform/counters";

const router: IRouter = Router();

router.get("/platform/stats", async (_req, res): Promise<void> => {
  const [activeJobs] = await db
    .select({ count: count() })
    .from(jobsTable)
    .where(and(eq(jobsTable.isActive, true), eq(jobsTable.isSuspendedByAdmin, false)));

  const [totalCandidates] = await db
    .select({ count: count() })
    .from(candidatesTable)
    .where(and(eq(candidatesTable.isActive, true), eq(candidatesTable.isSuspendedByAdmin, false)));

  const [totalCompanies] = await db.select({ count: count() }).from(companiesTable);

  res.json({
    activeJobs: activeJobs.count,
    totalCandidates: totalCandidates.count,
    totalCompanies: totalCompanies.count,
  });
});

router.get("/platform/counters/interview-chances", async (_req, res): Promise<void> => {
  const value = await getInterviewChancesCount();
  res.json({ key: "interview_chances", value });
});

export default router;
