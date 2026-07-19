import { eq, and } from "drizzle-orm";
import {
  db,
  candidatesTable,
  contactAccessGrantsTable,
  contactRequestsTable,
  usersTable,
  type Candidate,
} from "@workspace/db";
import type { User } from "@workspace/db";

export type BlurContext = {
  viewer: User | null;
  hrUserId?: number;
};

function isSubscriptionActive(candidate: Candidate): boolean {
  if (candidate.subscriptionTier === "vip") return true;
  if (candidate.subscriptionTier === "time_limited" && candidate.subscriptionExpiresAt) {
    return candidate.subscriptionExpiresAt > new Date();
  }
  return false;
}

export async function hasHrAccess(
  candidateId: number,
  hrUserId: number,
): Promise<boolean> {
  const grants = await db
    .select()
    .from(contactAccessGrantsTable)
    .where(
      and(
        eq(contactAccessGrantsTable.candidateId, candidateId),
        eq(contactAccessGrantsTable.hrUserId, hrUserId),
      ),
    );

  const now = new Date();
  return grants.some((g) => !g.expiresAt || g.expiresAt > now);
}

export async function shouldBlurCandidate(
  candidate: Candidate,
  ctx: BlurContext,
): Promise<boolean> {
  const { viewer } = ctx;

  if (viewer?.id === candidate.userId) return false;
  if (viewer?.role === "admin") return false;

  if (isSubscriptionActive(candidate) && !candidate.isContactBlurred) {
    return false;
  }

  if (viewer?.role === "hr") {
    const hasGrant = await hasHrAccess(candidate.id, viewer.id);
    if (hasGrant) return false;

    const requests = await db
      .select()
      .from(contactRequestsTable)
      .where(
        and(
          eq(contactRequestsTable.candidateId, candidate.id),
          eq(contactRequestsTable.hrUserId, viewer.id),
          eq(contactRequestsTable.status, "accepted"),
        ),
      );
    if (requests.length > 0 && isSubscriptionActive(candidate)) {
      return false;
    }
  }

  return candidate.isContactBlurred;
}

export async function enrichContactFields(
  candidate: Candidate,
): Promise<{ contactEmail: string | null; contactPhone: string | null }> {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, candidate.userId));

  return {
    contactEmail: candidate.contactEmail ?? user?.email ?? null,
    contactPhone: candidate.contactPhone ?? null,
  };
}

const MASK = "••••••••";

export function applyBlurToCandidate(
  candidate: Candidate,
  shouldBlur: boolean,
  contact: { contactEmail: string | null; contactPhone: string | null },
) {
  if (!shouldBlur) {
    return {
      ...candidate,
      contactEmail: contact.contactEmail,
      contactPhone: contact.contactPhone,
      canViewContact: true,
    };
  }

  return {
    ...candidate,
    fullName: candidate.fullName.length > 2
      ? candidate.fullName.charAt(0) + MASK
      : MASK,
    contactEmail: null,
    contactPhone: null,
    cvUrl: null,
    voiceIntroUrl: null,
    videoIntroUrl: null,
    userId: 0,
    canViewContact: false,
  };
}

export async function createAccessGrant(
  hrUserId: number,
  candidateId: number,
  contactRequestId: number | null,
  expiresAt: Date | null,
) {
  const [grant] = await db
    .insert(contactAccessGrantsTable)
    .values({
      hrUserId,
      candidateId,
      contactRequestId,
      expiresAt,
    })
    .returning();
  return grant;
}

export async function activateSubscriptionForCandidate(
  userId: number,
  tier: "vip" | "time_limited",
  expiresAt: Date,
  contactRequestId?: number,
) {
  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.userId, userId));

  if (!candidate) return null;

  await db
    .update(candidatesTable)
    .set({
      subscriptionTier: tier,
      subscriptionExpiresAt: expiresAt,
      isContactBlurred: false,
    })
    .where(eq(candidatesTable.userId, userId));

  if (contactRequestId) {
    const [cr] = await db
      .select()
      .from(contactRequestsTable)
      .where(eq(contactRequestsTable.id, contactRequestId));

    if (cr) {
      await createAccessGrant(cr.hrUserId, candidate.id, contactRequestId, expiresAt);
      await db
        .update(contactRequestsTable)
        .set({ status: "accepted", unblurredAt: new Date() })
        .where(eq(contactRequestsTable.id, contactRequestId));
    }
  }

  return candidate;
}
