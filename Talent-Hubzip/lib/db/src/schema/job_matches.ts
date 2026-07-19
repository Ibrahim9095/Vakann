import { pgTable, serial, integer, real, timestamp, uniqueIndex, jsonb } from "drizzle-orm/pg-core";

export const jobMatchesTable = pgTable(
  "job_matches",
  {
    id: serial("id").primaryKey(),
    jobId: integer("job_id").notNull(),
    candidateId: integer("candidate_id").notNull(),
    score: real("score").notNull(),
    factors: jsonb("factors").$type<Record<string, number>>().notNull().default({}),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("job_matches_job_candidate_idx").on(t.jobId, t.candidateId)],
);

export type JobMatch = typeof jobMatchesTable.$inferSelect;
