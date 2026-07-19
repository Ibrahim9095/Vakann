import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const mediaViewLogsTable = pgTable("media_view_logs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  candidateId: integer("candidate_id").notNull(),
  hrUserId: integer("hr_user_id").notNull(),
  mediaType: text("media_type").notNull(), // voice | video
  viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MediaViewLog = typeof mediaViewLogsTable.$inferSelect;
