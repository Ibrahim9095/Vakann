import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contactRequestsTable = pgTable("contact_requests", {
  id: serial("id").primaryKey(),
  hrUserId: integer("hr_user_id").notNull(),
  candidateId: integer("candidate_id").notNull(),
  jobId: integer("job_id"),
  type: text("type").notNull().default("interview_invite"), // interview_invite | contact_request
  status: text("status").notNull().default("pending"), // pending | accepted | accepted_pending_payment | declined | cancelled | expired
  message: text("message"),
  unblurredAt: timestamp("unblurred_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertContactRequestSchema = createInsertSchema(contactRequestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertContactRequest = z.infer<typeof insertContactRequestSchema>;
export type ContactRequest = typeof contactRequestsTable.$inferSelect;
