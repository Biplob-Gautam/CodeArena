import "dotenv/config";
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not set. Add it to the backend .env file.");
}

let parsedRedisUrl;
try {
  parsedRedisUrl = new URL(redisUrl);
} catch (error) {
  throw new Error("REDIS_URL must be a valid Redis connection URL.", {
    cause: error,
  });
}

if (!["redis:", "rediss:"].includes(parsedRedisUrl.protocol)) {
  throw new Error("REDIS_URL must use the redis:// or rediss:// protocol.");
}

export const redis = new Redis(redisUrl, {
  enableReadyCheck: true,
  maxRetriesPerRequest: null,
  retryStrategy: (attempt) => Math.min(attempt * 250, 5000),
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error.message);
});

export async function disconnectRedis() {
  if (redis.status !== "end") {
    await redis.quit();
  }
}