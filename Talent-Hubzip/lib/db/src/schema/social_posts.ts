import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const socialPostsTable = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  channel: text("channel").notNull(), // instagram | telegram | linkedin
  status: text("status").notNull().default("pending"), // pending | posted | failed
  externalPostId: text("external_post_id"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  postedAt: timestamp("posted_at", { withTimezone: true }),
});

export const insertSocialPostSchema = createInsertSchema(socialPostsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type SocialPost = typeof socialPostsTable.$inferSelect;
