/**
 * Distributed rate limiter using @upstash/ratelimit (production).
 * Falls back to in-memory limiter when Upstash is not configured (dev).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---- Upstash rate limiter (production) ----
function getUpstashLimiter(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
    prefix: "ratelimit:audit",
  });
}

// ---- In-memory fallback (dev) ----
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limits = new Map<string, RateLimitEntry>();

function memoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = limits.get(key);

  if (!entry || now > entry.resetAt) {
    limits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetIn: entry.resetAt - now,
  };
}

// ---- Public API ----
export async function rateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const upstash = getUpstashLimiter();

  if (upstash) {
    const { success, remaining, reset } = await upstash.limit(key);
    return {
      allowed: success,
      remaining,
      resetIn: Math.max(0, reset - Date.now()),
    };
  }

  // Dev fallback
  return memoryRateLimit(key, maxRequests, windowMs);
}
