import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, ratingsTable, candidatesTable, companiesTable, contactRequestsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const RATING_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function checkRatingEligibility(
  user: { id: number; role: string },
  candidateId: number,
  acceptedInvites: Array<{ unblurredAt: Date | null }>,
  existingRating: boolean,
): { allowed: boolean; reason?: string } {
  if (user.role === "admin") return { allowed: !existingRating, reason: existingRating ? "already_rated" : undefined };
  if (existingRating) return { allowed: false, reason: "already_rated" };
  if (acceptedInvites.length === 0) return { allowed: false, reason: "no_accepted_invite" };
  const invite = acceptedInvites[0];
  if (!invite.unblurredAt || Date.now() - invite.unblurredAt.getTime() < RATING_COOLDOWN_MS) {
    return { allowed: false, reason: "cooldown" };
  }
  return { allowed: true };
}

router.get("/ratings/eligibility", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (user.role !== "hr" && user.role !== "admin") {
    res.status(403).json({ error: "Only HR users can check rating eligibility" });
    return;
  }

  const { candidateId } = req.query;
  if (!candidateId) { res.status(400).json({ error: "candidateId is required" }); return; }
  const cid = parseInt(candidateId as string, 10);

  const acceptedInvites = await db.select().from(contactRequestsTable).where(
    and(
      eq(contactRequestsTable.candidateId, cid),
      eq(contactRequestsTable.hrUserId, user.id),
      eq(contactRequestsTable.status, "accepted"),
    ),
  );

  const existing = await db.select().from(ratingsTable).where(eq(ratingsTable.candidateId, cid));
  const duplicate = existing.some((r) => r.hrUserId === user.id);

  res.json(checkRatingEligibility(user, cid, acceptedInvites, duplicate));
});

router.get("/ratings", async (req, res): Promise<void> => {
  const { candidateId } = req.query;
  if (!candidateId) { res.status(400).json({ error: "candidateId is required" }); return; }

  const ratings = await db.select().from(ratingsTable).where(eq(ratingsTable.candidateId, parseInt(candidateId as string, 10)));

  const enriched = await Promise.all(ratings.map(async (r) => {
    const companies = await db.select().from(companiesTable).where(eq(companiesTable.userId, r.hrUserId));
    return { ...r, company: companies[0] ?? null };
  }));

  res.json(enriched);
});

router.post("/ratings", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (user.role !== "hr" && user.role !== "admin") {
    res.status(403).json({ error: "Only HR users can submit ratings" });
    return;
  }

  const { candidateId, stars, comment } = req.body;
  if (!candidateId || !stars) { res.status(400).json({ error: "candidateId and stars are required" }); return; }
  if (stars < 1 || stars > 5) { res.status(400).json({ error: "stars must be between 1 and 5" }); return; }

  const acceptedInvites = await db.select().from(contactRequestsTable).where(
    and(
      eq(contactRequestsTable.candidateId, candidateId),
      eq(contactRequestsTable.hrUserId, user.id),
      eq(contactRequestsTable.status, "accepted"),
    ),
  );

  const existing = await db.select().from(ratingsTable).where(eq(ratingsTable.candidateId, candidateId));
  const duplicate = existing.some((r) => r.hrUserId === user.id);
  const eligibility = checkRatingEligibility(user, candidateId, acceptedInvites, duplicate);

  if (!eligibility.allowed) {
    const messages: Record<string, string> = {
      already_rated: "You have already rated this candidate",
      no_accepted_invite: "Rating allowed only after accepted interview invite",
      cooldown: "Please wait 24 hours after interview before rating",
    };
    res.status(403).json({ error: messages[eligibility.reason ?? ""] ?? "Rating not allowed" });
    return;
  }

  const [rating] = await db.insert(ratingsTable).values({
    hrUserId: user.id,
    candidateId,
    stars,
    comment,
  }).returning();

  const allRatings = await db.select().from(ratingsTable).where(eq(ratingsTable.candidateId, candidateId));
  const total = allRatings.length;
  const average = allRatings.reduce((sum, r) => sum + r.stars, 0) / total;

  await db.update(candidatesTable).set({
    averageRating: average,
    totalRatings: total,
  }).where(eq(candidatesTable.id, candidateId));

  const companies = await db.select().from(companiesTable).where(eq(companiesTable.userId, user.id));
  res.status(201).json({ ...rating, company: companies[0] ?? null });
});

export default router;
