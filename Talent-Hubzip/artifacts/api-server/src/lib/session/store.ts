import crypto from "crypto";
import { getRedisClient } from "./redis";

export type SessionData = {
  userId: number;
  createdAt: string;
};

const SESSION_PREFIX = "jobera:session:";

function sessionTtlSeconds(): number {
  const days = parseInt(process.env.SESSION_TTL_DAYS ?? "7", 10);
  return days * 24 * 60 * 60;
}

function sessionKey(token: string): string {
  return `${SESSION_PREFIX}${token}`;
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: number): Promise<string> {
  const token = generateSessionToken();
  const data: SessionData = {
    userId,
    createdAt: new Date().toISOString(),
  };
  const redis = getRedisClient();
  await redis.set(sessionKey(token), JSON.stringify(data), "EX", sessionTtlSeconds());
  return token;
}

export async function getSession(token: string): Promise<SessionData | null> {
  const redis = getRedisClient();
  const raw = await redis.get(sessionKey(token));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export async function getSessionUserId(token: string): Promise<number | undefined> {
  const session = await getSession(token);
  return session?.userId;
}

export async function touchSession(token: string): Promise<boolean> {
  const redis = getRedisClient();
  const key = sessionKey(token);
  const exists = await redis.exists(key);
  if (!exists) return false;
  await redis.expire(key, sessionTtlSeconds());
  return true;
}

export async function deleteSession(token: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(sessionKey(token));
}
