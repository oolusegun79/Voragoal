import { prisma } from "@/server/db";

const API_BASE = "https://v3.football.api-sports.io";

export function isApiFeedConfigured(): boolean {
  return Boolean(process.env.API_FOOTBALL_KEY);
}

type ApiFootballOptions = {
  /** Number of retries on 429 / 5xx (default 1, exponential 250ms → 500ms). */
  retries?: number;
  signal?: AbortSignal;
};

/**
 * Shared API-Football v3 client. All API-Football traffic must route through
 * here so we have one place to add observability, retries, and quota tracking.
 *
 * Auth: x-apisports-key header from API_FOOTBALL_KEY env var.
 * Errors: throws on non-OK status. Caller is responsible for log/swallow.
 * Retries: only on 429 / 5xx, defaults to 1 retry with exponential backoff.
 */
export async function apiFootball<T>(
  path: string,
  opts: ApiFootballOptions = {},
): Promise<T> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY not configured");

  const maxRetries = opts.retries ?? 1;
  let attempt = 0;
  let lastErr: unknown;
  while (attempt <= maxRetries) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "x-apisports-key": key },
      cache: "no-store",
      signal: opts.signal,
    });
    if (res.ok) return res.json() as Promise<T>;

    const retriable = res.status === 429 || (res.status >= 500 && res.status <= 599);
    if (!retriable || attempt === maxRetries) {
      const body = await res.text().catch(() => "");
      throw new Error(`API-Football ${res.status}: ${body}`);
    }
    // 250ms → 500ms backoff
    await new Promise((r) => setTimeout(r, 250 * Math.pow(2, attempt)));
    attempt += 1;
    lastErr = res.status;
  }
  // Unreachable, but TS needs it.
  throw new Error(`API-Football retries exhausted: ${String(lastErr)}`);
}

/**
 * Per-key time-based throttle backed by the FeedCallLog table. Returns true
 * when the caller should SKIP this tick (i.e. less than `intervalSec` has
 * elapsed since the key's last successful call). Returns false when the
 * caller should proceed — in which case it also marks the key as called now,
 * so two concurrent ticks won't double-fire.
 *
 * Designed to replace the inline `getUTCMinutes() % 5 === 0` checks in
 * feedImportService.ts with a generic per-endpoint cadence (e.g. injuries
 * hourly, lineups every 5 min per match, topscorers every 30 min).
 *
 * Note: the "mark as called" happens atomically via upsert. If the actual
 * API call subsequently fails, the next tick still waits — that's
 * intentional belt-and-braces against quota burn during outages.
 */
export async function shouldThrottle(
  key: string,
  intervalSec: number,
): Promise<boolean> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - intervalSec * 1000);
  const existing = await prisma.feedCallLog.findUnique({ where: { key } });
  if (existing && existing.lastCalledAt > cutoff) return true;
  await prisma.feedCallLog.upsert({
    where: { key },
    create: { key, lastCalledAt: now },
    update: { lastCalledAt: now },
  });
  return false;
}

// Shared API-Football response shape primitives. Endpoint-specific response
// types live next to their consumers in services/.
export type ApiPlayer = { id: number | null; name: string | null };
export type ApiTeamRef = { id: number; name: string };
export type ApiPaging = { current: number; total: number };
