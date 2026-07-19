import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, companiesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { getActiveCompanySubscription, getCompanyMediaQuota } from "../lib/hr-limits";

const router: IRouter = Router();

router.get("/companies", async (req, res): Promise<void> => {
  const { search, page = "1", limit = "20" } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  let all = await db.select().from(companiesTable);
  if (search) {
    const s = (search as string).toLowerCase();
    all = all.filter(c => c.name.toLowerCase().includes(s) || (c.sector ?? "").toLowerCase().includes(s));
  }

  const start = (pageNum - 1) * limitNum;
  res.json(all.slice(start, start + limitNum));
});

router.post("/companies", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (user.role !== "hr" && user.role !== "admin") {
    res.status(403).json({ error: "Only HR users can create company profiles" });
    return;
  }

  const { name, logoUrl, sector, description, city, address, website, contactEmail, contactPhone, employeeCount } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }

  const [company] = await db.insert(companiesTable).values({
    userId: user.id,
    name,
    logoUrl,
    sector,
    description,
    city,
    address,
    website,
    contactEmail,
    contactPhone,
    employeeCount,
  }).returning();

  res.status(201).json(company);
});

router.get("/companies/me", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.userId, user.id));
  if (!company) { res.status(404).json({ error: "No company profile found" }); return; }
  res.json(company);
});

router.get("/companies/me/subscription", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.userId, user.id));
  if (!company) { res.status(404).json({ error: "No company profile found" }); return; }

  const subscription = await getActiveCompanySubscription(company.id);
  const quota = await getCompanyMediaQuota(company.id);
  res.json({ subscription, quota, company });
});

router.get("/companies/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, id));
  if (!company) { res.status(404).json({ error: "Company not found" }); return; }
  res.json(company);
});

router.patch("/companies/:id", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [existing] = await db.select().from(companiesTable).where(eq(companiesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.userId !== user.id && user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const updateData: Partial<typeof companiesTable.$inferInsert> = {};
  const fields = ["name","logoUrl","sector","description","city","address","website","contactEmail","contactPhone","employeeCount"];
  for (const field of fields) {
    if (req.body[field] !== undefined) (updateData as Record<string, unknown>)[field] = req.body[field];
  }

  const [updated] = await db.update(companiesTable).set(updateData).where(eq(companiesTable.id, id)).returning();
  res.json(updated);
});

export default router;
