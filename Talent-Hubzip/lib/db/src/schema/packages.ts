import { pgTable, serial, text, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const packagesTable = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tier: text("tier").notNull(), // vip | time_1day | time_15day | time_30day | hr_basic | hr_premium | hr_enterprise
  audience: text("audience").notNull().default("candidate"), // candidate | hr
  description: text("description"),
  price: real("price").notNull(),
  currency: text("currency").notNull().default("AZN"),
  durationDays: integer("duration_days").notNull(),
  mediaViewLimit: integer("media_view_limit").notNull().default(0),
  features: text("features").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  packageId: integer("package_id").notNull(),
  status: text("status").notNull().default("active"), // active | expired | cancelled
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPackageSchema = createInsertSchema(packagesTable).omit({ id: true, createdAt: true });
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Package = typeof packagesTable.$inferSelect;

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ id: true, createdAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
