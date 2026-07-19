import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

const sessionStore = new Map<string, number>();

vi.mock("../../artifacts/api-server/src/lib/session/store", () => ({
  createSession: vi.fn(async (userId: number) => {
    const token = `test_token_${userId}_${Date.now()}`;
    sessionStore.set(token, userId);
    return token;
  }),
  getSession: vi.fn(async (token: string) => {
    const userId = sessionStore.get(token);
    if (!userId) return null;
    return { userId, createdAt: new Date().toISOString() };
  }),
  getSessionUserId: vi.fn(async (token: string) => sessionStore.get(token)),
  touchSession: vi.fn(async (token: string) => sessionStore.has(token)),
  deleteSession: vi.fn(async (token: string) => {
    sessionStore.delete(token);
  }),
}));

const users: Array<{
  id: number;
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
  avatarUrl: null;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}> = [];

vi.mock("@workspace/db", () => {
  const chain = () => ({
    from: () => ({
      where: () => Promise.resolve(users),
    }),
  });

  return {
    db: {
      select: chain,
      insert: () => ({
        values: () => ({
          returning: () => {
            const user = {
              id: users.length + 1,
              email: "new@test.az",
              passwordHash: "$2b$12$test",
              fullName: "Test User",
              role: "candidate",
              avatarUrl: null,
              isBanned: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            users.push(user);
            return Promise.resolve([user]);
          },
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => Promise.resolve(),
        }),
      }),
    },
    usersTable: {},
  };
});

vi.mock("../../artifacts/api-server/src/lib/password", () => ({
  hashPassword: vi.fn(async () => "$2b$12$hashed"),
  verifyPassword: vi.fn(async (plain: string, hash: string) => ({
    valid: plain === "password123" || hash.startsWith("$2"),
    needsRehash: false,
  })),
}));

import authRouter from "../../artifacts/api-server/src/routes/auth";

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as express.Request & { log: { info: () => void } }).log = { info: () => {} };
  next();
});
app.use(authRouter);

describe("auth routes", () => {
  beforeEach(() => {
    sessionStore.clear();
    users.length = 0;
  });

  it("registers and returns token", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "a@test.az", password: "password123", fullName: "Ali", role: "candidate" });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("new@test.az");
  });

  it("returns 401 for /auth/me without token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });
});
