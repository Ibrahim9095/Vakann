import { pgTable, serial, text, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const candidatesTable = pgTable("candidates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  avatarUrl: text("avatar_url"),
  category: text("category").notNull(),
  title: text("title"),
  summary: text("summary"),
  city: text("city"),
  district: text("district"),
  metroStation: text("metro_station"),
  salaryExpectation: integer("salary_expectation"),
  currency: text("currency").notNull().default("AZN"),
  experienceYears: integer("experience_years"),
  education: text("education"),
  languages: text("languages").array().notNull().default([]),
  skills: text("skills").array().notNull().default([]),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  cvUrl: text("cv_url"),
  voiceIntroUrl: text("voice_intro_url"),
  videoIntroUrl: text("video_intro_url"),
  hasDisabilityStatus: boolean("has_disability_status").notNull().default(false),
  hasMedicalRestriction: boolean("has_medical_restriction").notNull().default(false),
  hasFinancialIssues: boolean("has_financial_issues").notNull().default(false),
  isContactBlurred: boolean("is_contact_blurred").notNull().default(true),
  subscriptionTier: text("subscription_tier").notNull().default("free"), // free | vip | time_limited
  subscriptionExpiresAt: timestamp("subscription_expires_at", { withTimezone: true }),
  averageRating: real("average_rating"),
  totalRatings: integer("total_ratings").notNull().default(0),
  profileViews: integer("profile_views").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isSuspendedByAdmin: boolean("is_suspended_by_admin").notNull().default(false),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCandidateSchema = createInsertSchema(candidatesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidatesTable.$inferSelect;
