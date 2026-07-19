import { eq, lt } from "drizzle-orm";
import {
  db,
  subscriptionsTable,
  candidatesTable,
  contactAccessGrantsTable,
} from "@workspace/db";
import { logger } from "../lib/logger";

export async function expireSubscriptions() {
  const now = new Date();

  const expiredSubs = await db
    .select()
    .from(subscriptionsTable)
    .where(lt(subscriptionsTable.expiresAt, now));

  const activeExpired = expiredSubs.filter((s) => s.status === "active");
  if (activeExpired.length === 0) return 0;

  for (const sub of activeExpired) {
    await db
      .update(subscriptionsTable)
      .set({ status: "expired" })
      .where(eq(subscriptionsTable.id, sub.id));

    const [candidate] = await db
      .select()
      .from(candidatesTable)
      .where(eq(candidatesTable.userId, sub.userId));

    if (!candidate) continue;

    const otherActive = await db.select().from(subscriptionsTable).where(
      eq(subscriptionsTable.userId, sub.userId),
    );
    const hasOther = otherActive.some(
      (s) => s.id !== sub.id && s.status === "active" && s.expiresAt > now,
    );

    if (!hasOther) {
      await db
        .update(candidatesTable)
        .set({
          subscriptionTier: "free",
          subscriptionExpiresAt: null,
          isContactBlurred: true,
        })
        .where(eq(candidatesTable.userId, sub.userId));

      await db
        .delete(contactAccessGrantsTable)
        .where(eq(contactAccessGrantsTable.candidateId, candidate.id));
    }
  }

  logger.info({ count: activeExpired.length }, "Expired subscriptions processed");
  return activeExpired.length;
}

export function startSubscriptionExpiryJob(intervalMs = 60 * 60 * 1000) {
  const run = () => {
    expireSubscriptions().catch((err) => {
      logger.error({ err }, "Subscription expiry job failed");
    });
  };
  run();
  return setInterval(run, intervalMs);
}
