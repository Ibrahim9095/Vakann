import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const companySubscriptionsTable = pgTable("company_subscriptions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  packageId: integer("package_id").notNull(),
  status: text("status").notNull().default("active"), // active | expired | cancelled
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  mediaViewLimit: integer("media_view_limit").notNull().default(10),
  mediaViewsUsed: integer("media_views_used").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CompanySubscription = typeof companySubscriptionsTable.$inferSelect;
