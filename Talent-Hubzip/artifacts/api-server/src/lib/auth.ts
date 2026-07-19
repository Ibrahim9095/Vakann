import { type Request, type Response } from "express";
import { getSessionUserId } from "./session/store";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export type AuthUser = {
  id: number;
  role: string;
  email: string;
  fullName: string;
  passwordHash: string;
  avatarUrl: string | null;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function getCurrentUser(req: Request): Promise<AuthUser | null> {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const userId = await getSessionUserId(token);
  if (!userId) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user ?? null;
}

export async function requireAuth(req: Request, res: Response): Promise<AuthUser | null> {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  if (user.isBanned) {
    res.status(403).json({ error: "Bu hesab bloklanmışdır." });
    return null;
  }
  return user;
}

export async function requireRole(
  req: Request,
  res: Response,
  role: string,
): Promise<AuthUser | null> {
  const user = await requireAuth(req, res);
  if (!user) return null;
  if (user.role !== role && user.role !== "admin") {
    res.status(403).json({ error: "Forbidden: insufficient role" });
    return null;
  }
  return user;
}
