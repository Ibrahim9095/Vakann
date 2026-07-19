import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const platformCountersTable = pgTable("platform_counters", {
  key: text("key").primaryKey(),
  value: integer("value").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const INTERVIEW_CHANCES_COUNTER_KEY = "interview_chances";
