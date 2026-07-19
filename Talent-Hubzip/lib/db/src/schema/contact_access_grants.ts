import { pgTable, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contactAccessGrantsTable = pgTable("contact_access_grants", {
  id: serial("id").primaryKey(),
  hrUserId: integer("hr_user_id").notNull(),
  candidateId: integer("candidate_id").notNull(),
  contactRequestId: integer("contact_request_id"),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const insertContactAccessGrantSchema = createInsertSchema(contactAccessGrantsTable).omit({
  id: true,
  grantedAt: true,
});
export type InsertContactAccessGrant = z.infer<typeof insertContactAccessGrantSchema>;
export type ContactAccessGrant = typeof contactAccessGrantsTable.$inferSelect;
