import Redis from "ioredis";
import { logger } from "../logger";

let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (!client) {
    const url = process.env.REDIS_URL ?? "redis://localhost:6379";
    client = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    client.on("error", (err) => {
      logger.error({ err }, "Redis connection error");
    });
  }
  return client;
}

export async function connectRedis(): Promise<void> {
  const redis = getRedisClient();
  if (redis.status === "wait") {
    await redis.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
