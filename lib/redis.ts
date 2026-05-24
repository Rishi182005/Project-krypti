import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function createRedis() {
  const client = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });
  client.on("error", (err) => console.error("Redis error:", err));
  return client;
}

export const redis = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;