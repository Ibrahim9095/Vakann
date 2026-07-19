import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, candidatesTable } from "@workspace/db";
import { getCurrentUser, requireAuth } from "../lib/auth";
import {
  shouldBlurCandidate,
  enrichContactFields,
  applyBlurToCandidate,
} from "../lib/blur";
import { recomputeForCandidate } from "../lib/matching/service";

const router: IRouter = Router();

async function formatCandidate(
  candidate: typeof candidatesTable.$inferSelect,
  viewer: Awaited<ReturnType<typeof getCurrentUser>>,
) {
  const contact = await enrichContactFields(candidate);
  const blur = await shouldBlurCandidate(candidate, { viewer });
  return applyBlurToCandidate(candidate, blur, contact);
}

router.get("/candidates", async (req, res): Promise<void> => {
  const { city, district, metro, category, hasDisability, hasFinancialIssues, salaryMin, salaryMax, search, page = "1", limit = "20" } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;
  const viewer = await getCurrentUser(req);

  let allRows = (await db.select().from(candidatesTable).where(eq(candidatesTable.isActive, true))).filter(c => !c.isSuspendedByAdmin);

  if (city) allRows = allRows.filter(c => c.city === city);
  if (district) allRows = allRows.filter(c => c.district === district);
  if (metro) allRows = allRows.filter(c => c.metroStation === metro);
  if (category) allRows = allRows.filter(c => c.category === category);
  if (hasDisability === "true") allRows = allRows.filter(c => c.hasDisabilityStatus);
  if (hasFinancialIssues === "false") allRows = allRows.filter(c => !c.hasFinancialIssues);
  if (salaryMin) allRows = allRows.filter(c => c.salaryExpectation != null && c.salaryExpectation >= parseInt(salaryMin as string, 10));
  if (salaryMax) allRows = allRows.filter(c => c.salaryExpectation != null && c.salaryExpectation <= parseInt(salaryMax as string, 10));
  if (search) {
    const s = (search as string).toLowerCase();
    allRows = allRows.filter(c => c.fullName.toLowerCase().includes(s) || (c.title ?? "").toLowerCase().includes(s) || c.category.toLowerCase().includes(s) || c.skills.some(sk => sk.toLowerCase().includes(s)));
  }

  const tierOrder = { vip: 0, time_limited: 1, free: 2 };
  const sorted = allRows.sort((a, b) => {
    const ta = tierOrder[a.subscriptionTier as keyof typeof tierOrder] ?? 2;
    const tb = tierOrder[b.subscriptionTier as keyof typeof tierOrder] ?? 2;
    if (ta !== tb) return ta - tb;
    if (ta === 2 && tb === 2) {
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
    return (b.averageRating ?? 0) - (a.averageRating ?? 0);
  });

  const total = sorted.length;
  const slice = sorted.slice(offset, offset + limitNum);
  const data = await Promise.all(slice.map(c => formatCandidate(c, viewer)));

  res.json({ data, total, page: pageNum, limit: limitNum });
});

router.post("/candidates", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (user.role !== "candidate" && user.role !== "admin") {
    res.status(403).json({ error: "Only candidate users can create candidate profiles" });
    return;
  }

  const existing = await db.select().from(candidatesTable).where(eq(candidatesTable.userId, user.id));
  if (existing.length > 0) {
    res.status(400).json({ error: "Candidate profile already exists. Use PATCH to update." });
    return;
  }

  const { fullName, category, title, summary, city, district, metroStation, salaryExpectation, currency, experienceYears, education, languages, skills, cvUrl, voiceIntroUrl, videoIntroUrl, hasDisabilityStatus, hasMedicalRestriction, hasFinancialIssues, contactEmail, contactPhone } = req.body;

  if (!fullName || !category) {
    res.status(400).json({ error: "fullName and category are required" });
    return;
  }

  const [candidate] = await db.insert(candidatesTable).values({
    userId: user.id,
    fullName,
    category,
    title,
    summary,
    city,
    district,
    metroStation,
    salaryExpectation,
    currency: currency ?? "AZN",
    experienceYears,
    education,
    languages: languages ?? [],
    skills: skills ?? [],
    cvUrl,
    voiceIntroUrl,
    videoIntroUrl,
    contactEmail: contactEmail ?? user.email,
    contactPhone,
    hasDisabilityStatus: hasDisabilityStatus ?? false,
    hasMedicalRestriction: hasMedicalRestriction ?? false,
    hasFinancialIssues: hasFinancialIssues ?? false,
    isContactBlurred: true,
  }).returning();

  recomputeForCandidate(candidate.id).catch(() => {});

  res.status(201).json(candidate);
});

router.get("/candidates/me", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.userId, user.id));
  if (!candidate) { res.status(404).json({ error: "No candidate profile found" }); return; }
  const contact = await enrichContactFields(candidate);
  res.json({ ...candidate, contactEmail: contact.contactEmail, contactPhone: contact.contactPhone });
});

router.get("/candidates/top", async (req, res): Promise<void> => {
  const { category, limit = "6" } = req.query;
  const limitNum = parseInt(limit as string, 10);
  const viewer = await getCurrentUser(req);
  const now = new Date();

  let all = await db.select().from(candidatesTable).where(eq(candidatesTable.isActive, true));
  if (category) all = all.filter(c => c.category === category);

  const top = all
    .filter(c => c.subscriptionTier === "vip" || (c.subscriptionTier === "time_limited" && c.subscriptionExpiresAt && c.subscriptionExpiresAt > now))
    .sort((a, b) => {
      const tierOrder = { vip: 0, time_limited: 1, free: 2 };
      const ta = tierOrder[a.subscriptionTier as keyof typeof tierOrder] ?? 2;
      const tb = tierOrder[b.subscriptionTier as keyof typeof tierOrder] ?? 2;
      if (ta !== tb) return ta - tb;
      return (b.averageRating ?? 0) - (a.averageRating ?? 0);
    })
    .slice(0, limitNum);

  const data = await Promise.all(top.map(c => formatCandidate(c, viewer)));
  res.json(data);
});

router.get("/candidates/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, id));
  if (!candidate) { res.status(404).json({ error: "Candidate not found" }); return; }

  await db.update(candidatesTable).set({ profileViews: candidate.profileViews + 1 }).where(eq(candidatesTable.id, id));

  const viewer = await getCurrentUser(req);
  const updated = { ...candidate, profileViews: candidate.profileViews + 1 };
  res.json(await formatCandidate(updated, viewer));
});

router.patch("/candidates/:id", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [existing] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.userId !== user.id && user.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }

  const updateData: Partial<typeof candidatesTable.$inferInsert> = {};
  const fields = ["fullName","category","title","summary","city","district","metroStation","salaryExpectation","currency","experienceYears","education","languages","skills","cvUrl","voiceIntroUrl","videoIntroUrl","contactEmail","contactPhone","hasDisabilityStatus","hasMedicalRestriction","hasFinancialIssues","isActive","isContactBlurred"];
  for (const field of fields) {
    if (req.body[field] !== undefined) (updateData as Record<string, unknown>)[field] = req.body[field];
  }

  const [updated] = await db.update(candidatesTable).set(updateData).where(eq(candidatesTable.id, id)).returning();
  recomputeForCandidate(id).catch(() => {});
  res.json(updated);
});

export default router;
