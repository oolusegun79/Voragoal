import { NextResponse, type NextRequest } from "next/server";
import { aiLimiter, authLimiter, getClientIp } from "@/lib/ratelimit";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const ip = getClientIp(req.headers);

  // Choose the right limiter based on path. If the limiter is null (Upstash
  // env vars not configured), fall through with no rate limit applied.
  let limiter: typeof authLimiter | typeof aiLimiter | null = null;
  if (path.startsWith("/api/auth/")) limiter = authLimiter;
  else if (path.startsWith("/api/ai/")) limiter = aiLimiter;

  if (limiter) {
    const { success, limit, remaining, reset } = await limiter.limit(ip);
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return NextResponse.json(
        {
          error: {
            code: "rate_limit_exceeded",
            message: "Too many requests. Please wait a moment and try again.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
          },
        },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/ai/:path*"],
};
