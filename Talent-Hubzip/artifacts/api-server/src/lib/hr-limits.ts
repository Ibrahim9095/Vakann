import { eq, and, desc, gte } from "drizzle-orm";
import {
  db,
  companiesTable,
  companySubscriptionsTable,
  mediaViewLogsTable,
  packagesTable,
} from "@workspace/db";

const FREE_HR_MEDIA_LIMIT = 10;
const UNLIMITED = 999999;

export type CompanyMediaQuota = {
  companyId: number;
  tier: string;
  mediaViewLimit: number;
  mediaViewsUsed: number;
  expiresAt: Date | null;
  isActive: boolean;
};

export async function getCompanyMediaQuota(companyId: number): Promise<CompanyMediaQuota> {
  const now = new Date();
  const subs = await db
    .select()
    .from(companySubscriptionsTable)
    .where(and(eq(companySubscriptionsTable.companyId, companyId), eq(companySubscriptionsTable.status, "active")));

  const active = subs
    .filter((s) => s.expiresAt > now)
    .sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime())[0];

  if (active) {
    const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, active.packageId));
    return {
      companyId,
      tier: pkg?.tier ?? "hr_premium",
      mediaViewLimit: active.mediaViewLimit,
      mediaViewsUsed: active.mediaViewsUsed,
      expiresAt: active.expiresAt,
      isActive: true,
    };
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const logs = await db
    .select()
    .from(mediaViewLogsTable)
    .where(
      and(
        eq(mediaViewLogsTable.companyId, companyId),
        gte(mediaViewLogsTable.viewedAt, monthStart),
      ),
    );

  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, companyId));

  return {
    companyId,
    tier: company?.hrSubscriptionTier ?? "hr_basic",
    mediaViewLimit: FREE_HR_MEDIA_LIMIT,
    mediaViewsUsed: logs.length,
    expiresAt: null,
    isActive: false,
  };
}

export async function recordMediaView(
  companyId: number,
  candidateId: number,
  hrUserId: number,
  mediaType: "voice" | "video",
): Promise<{ allowed: boolean; quota: CompanyMediaQuota }> {
  const quota = await getCompanyMediaQuota(companyId);

  if (quota.mediaViewLimit >= UNLIMITED) {
    await db.insert(mediaViewLogsTable).values({ companyId, candidateId, hrUserId, mediaType });
    return { allowed: true, quota };
  }

  if (quota.mediaViewsUsed >= quota.mediaViewLimit) {
    return { allowed: false, quota };
  }

  await db.insert(mediaViewLogsTable).values({ companyId, candidateId, hrUserId, mediaType });

  if (quota.isActive) {
    const subs = await db
      .select()
      .from(companySubscriptionsTable)
      .where(and(eq(companySubscriptionsTable.companyId, companyId), eq(companySubscriptionsTable.status, "active")));
    const active = subs.sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime())[0];
    if (active) {
      await db
        .update(companySubscriptionsTable)
        .set({ mediaViewsUsed: active.mediaViewsUsed + 1 })
        .where(eq(companySubscriptionsTable.id, active.id));
    }
  }

  const updated = await getCompanyMediaQuota(companyId);
  return { allowed: true, quota: updated };
}

export async function activateCompanySubscription(
  companyId: number,
  packageId: number,
): Promise<void> {
  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, packageId));
  if (!pkg || pkg.audience !== "hr") return;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + pkg.durationDays);

  await db.insert(companySubscriptionsTable).values({
    companyId,
    packageId: pkg.id,
    status: "active",
    startsAt: new Date(),
    expiresAt,
    mediaViewLimit: pkg.mediaViewLimit,
    mediaViewsUsed: 0,
  });

  await db
    .update(companiesTable)
    .set({
      hrSubscriptionTier: pkg.tier,
      subscriptionExpiresAt: expiresAt,
    })
    .where(eq(companiesTable.id, companyId));
}

export async function getActiveCompanySubscription(companyId: number) {
  const subs = await db
    .select()
    .from(companySubscriptionsTable)
    .where(eq(companySubscriptionsTable.companyId, companyId))
    .orderBy(desc(companySubscriptionsTable.expiresAt));

  const now = new Date();
  const active = subs.find((s) => s.status === "active" && s.expiresAt > now);
  if (!active) return null;

  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, active.packageId));
  return { ...active, package: pkg ?? null };
}
