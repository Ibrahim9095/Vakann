import { pgTable, serial, text, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  requirements: text("requirements"),
  city: text("city"),
  address: text("address"),
  employmentType: text("employment_type").notNull().default("full_time"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  currency: text("currency").notNull().default("AZN"),
  isActive: boolean("is_active").notNull().default(true),
  isSuspendedByAdmin: boolean("is_suspended_by_admin").notNull().default(false),
  adminNote: text("admin_note"),
  viewCount: integer("view_count").notNull().default(0),
  applicationCount: integer("application_count").notNull().default(0),
  requiresVoiceIntro: boolean("requires_voice_intro").notNull().default(false),
  voicePrompt: text("voice_prompt"),
  requiresNearbyLocation: boolean("requires_nearby_location").notNull().default(false),
  jobLat: real("job_lat"),
  jobLng: real("job_lng"),
  radiusKm: integer("radius_km"),
  requiresHealthDeclaration: boolean("requires_health_declaration").notNull().default(false),
  requiresCreditDeclaration: boolean("requires_credit_declaration").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
