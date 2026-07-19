import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, contactRequestsTable, candidatesTable, companiesTable, jobsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { notifyUser } from "../lib/notifications/service";
import { incrementInterviewChances } from "../lib/platform/counters";
import { buildInterviewInviteMessage, buildInterviewInviteTitle } from "../lib/notifications/templates";

const router: IRouter = Router();

async function enrichContactRequest(cr: typeof contactRequestsTable.$inferSelect) {
  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, cr.candidateId));
  const companies = await db.select().from(companiesTable).where(eq(companiesTable.userId, cr.hrUserId));
  let job = null;
  if (cr.jobId) {
    const [j] = await db.select().from(jobsTable).where(eq(jobsTable.id, cr.jobId));
    job = j ?? null;
  }
  return { ...cr, candidate: candidate ?? null, company: companies[0] ?? null, job };
}

router.get("/contact-requests", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { status } = req.query;
  let all = await db.select().from(contactRequestsTable);

  if (user.role === "hr") {
    all = all.filter(cr => cr.hrUserId === user.id);
  } else if (user.role === "candidate") {
    const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.userId, user.id));
    if (candidate) all = all.filter(cr => cr.candidateId === candidate.id);
    else all = [];
  }

  if (status) all = all.filter(cr => cr.status === status);

  const enriched = await Promise.all(all.map(enrichContactRequest));
  res.json(enriched);
});

router.post("/contact-requests", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (user.role !== "hr" && user.role !== "admin") {
    res.status(403).json({ error: "Only HR users can send contact requests" });
    return;
  }

  const { candidateId, message, jobId } = req.body;
  if (!candidateId) { res.status(400).json({ error: "candidateId is required" }); return; }

  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, candidateId));
  if (!candidate) { res.status(404).json({ error: "Candidate not found" }); return; }

  let jobTitle = "Vakansiya";
  if (jobId) {
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
    if (job) jobTitle = job.title;
  }

  const existing = await db.select().from(contactRequestsTable).where(
    eq(contactRequestsTable.candidateId, candidateId),
  );
  const duplicate = existing.find(cr => cr.hrUserId === user.id && cr.status !== "declined" && cr.status !== "expired");
  if (duplicate) {
    res.status(400).json({ error: "Contact request already exists for this candidate" });
    return;
  }

  const [cr] = await db.insert(contactRequestsTable).values({
    hrUserId: user.id,
    candidateId,
    jobId: jobId ?? null,
    type: "interview_invite",
    message,
    status: "pending",
  }).returning();

  await incrementInterviewChances();

  const companies = await db.select().from(companiesTable).where(eq(companiesTable.userId, user.id));
  const companyName = companies[0]?.name ?? "HR";
  const inviteBody = buildInterviewInviteMessage(jobTitle);

  await notifyUser({
    userId: candidate.userId,
    type: "interview_invite",
    title: buildInterviewInviteTitle(),
    body: inviteBody,
    payload: { contactRequestId: cr.id, candidateId, jobId: jobId ?? null, companyName },
    channels: ["in_app", "telegram", "sms"],
  });

  res.status(201).json(await enrichContactRequest(cr));
});

router.patch("/contact-requests/:id", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [cr] = await db.select().from(contactRequestsTable).where(eq(contactRequestsTable.id, id));
  if (!cr) { res.status(404).json({ error: "Not found" }); return; }

  const { status } = req.body;

  if (user.role === "candidate") {
    const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.userId, user.id));
    if (!candidate || candidate.id !== cr.candidateId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  } else if (user.role === "hr") {
    if (cr.hrUserId !== user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (status === "cancelled" && cr.status !== "pending") {
      res.status(400).json({ error: "Only pending requests can be cancelled" });
      return;
    }
    if (status && status !== "cancelled") {
      res.status(403).json({ error: "HR can only cancel pending requests" });
      return;
    }
  } else if (user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const updateData: Partial<typeof contactRequestsTable.$inferInsert> = { status };

  if (status === "accepted") {
    const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, cr.candidateId));
    const isVip = candidate?.subscriptionTier === "vip";
    const hasActiveSub = candidate?.subscriptionTier === "time_limited"
      && candidate.subscriptionExpiresAt
      && candidate.subscriptionExpiresAt > new Date();

    if (isVip || hasActiveSub) {
      updateData.status = "accepted";
      updateData.unblurredAt = new Date();
    } else {
      updateData.status = "accepted_pending_payment";
    }
  }

  const [updated] = await db.update(contactRequestsTable).set(updateData).where(eq(contactRequestsTable.id, id)).returning();

  if (status === "accepted" && updated.status === "accepted_pending_payment") {
    await notifyUser({
      userId: user.id,
      type: "interview_invite",
      title: "Kontaktları aktivləşdirin",
      body: "Müsahibə dəvətini qəbul etdiniz. Əlaqə məlumatlarınızı açmaq üçün abunəlik paketi seçin.",
      payload: { contactRequestId: id, requiresPayment: true },
    });
  }

  res.json(await enrichContactRequest(updated));
});

export default router;
