import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// When Upstash env vars are missing (local dev, preview deploys without the
// vars set), the limiters resolve to null and the middleware short-circuits
// to a no-op. In production, set both UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN to turn rate limiting on.
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

/**
 * Auth endpoints (/api/auth/*): 10 attempts per minute per IP.
 * Protects against credential stuffing and brute-forcing the login page.
 */
export const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "rl:auth",
    })
  : null;

/**
 * AI endpoints (/api/ai/*): 20 requests per minute per IP.
 * Protects against Claude API cost burn from automated abuse.
 */
export const aiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      analytics: true,
      prefix: "rl:ai",
    })
  : null;

/**
 * Pull the client IP from the standard proxy headers Vercel sets.
 * Falls back to "unknown" so rate limiting still functions even if headers
 * are missing — all such requests would share one bucket, which is fine.
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
