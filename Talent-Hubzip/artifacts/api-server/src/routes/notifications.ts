import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { markNotificationRead } from "../lib/notifications/service";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const all = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, user.id));

  const sorted = all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  res.json(sorted);
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const updated = await markNotificationRead(id, user.id);
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(updated);
});

export default router;
