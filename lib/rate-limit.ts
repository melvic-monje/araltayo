import { Redis } from "@upstash/redis";

const DAILY_LIMIT = 10;
const TTL_SECONDS = 86400;

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

export async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `ai:${userId}:${today}`;

  const redis = getRedis();
  const current = await redis.get<number>(key);
  const count = current ?? 0;

  if (count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.expire(key, TTL_SECONDS);
  await pipeline.exec();

  return { allowed: true, remaining: DAILY_LIMIT - count - 1 };
}

export async function getRateLimitStatus(
  userId: string
): Promise<{ used: number; remaining: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const key = `ai:${userId}:${today}`;
  const current = await getRedis().get<number>(key);
  const used = current ?? 0;
  return { used, remaining: Math.max(0, DAILY_LIMIT - used) };
}
