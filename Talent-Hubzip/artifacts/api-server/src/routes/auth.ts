import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { hashPassword, verifyPassword } from "../lib/password";
import {
  createSession,
  deleteSession,
  getSession,
  touchSession,
} from "../lib/session/store";

const router: IRouter = Router();

function userResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, fullName, role } = req.body;
  if (!email || !password || !fullName) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  if (!["candidate", "hr"].includes(role)) {
    res.status(400).json({ error: "Role must be candidate or hr" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash: await hashPassword(password),
    fullName,
    role,
  }).returning();

  const token = await createSession(user.id);

  req.log.info({ userId: user.id }, "User registered");
  res.status(201).json({ user: userResponse(user), token });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Missing email or password" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const verification = await verifyPassword(password, user.passwordHash);
  if (!verification.valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (verification.needsRehash && verification.newHash) {
    await db
      .update(usersTable)
      .set({ passwordHash: verification.newHash })
      .where(eq(usersTable.id, user.id));
  }

  if (user.isBanned) {
    res.status(403).json({ error: "Bu hesab bloklanmışdır. Ətraflı məlumat üçün admin ilə əlaqə saxlayın." });
    return;
  }

  const token = await createSession(user.id);

  req.log.info({ userId: user.id }, "User logged in");
  res.json({ user: userResponse(user), token });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) await deleteSession(token);
  res.json({ success: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const session = await getSession(token);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await touchSession(token);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json(userResponse(user));
});

export default router;
