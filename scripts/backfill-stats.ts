/**
 * Backfill MatchStat rows for any Match that has externalApiId set but no
 * stats. Useful after first wiring up the stats importer — the live cron
 * only pulls stats for LIVE matches, so FINISHED matches before the wire-up
 * stay blank until this runs.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-stats.ts            # dry-run, list candidates
 *   pnpm tsx scripts/backfill-stats.ts --apply    # actually upsert
 *
 * Cost: 2 API-Football calls per match (1 fixture + 1 statistics). With 4
 * finished matches that's 8 calls — trivial against the daily 7500 budget.
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

loadEnv({ path: ".env.local", override: true });

import { apiFootball } from "@/server/api-football/client";

const APPLY = process.argv.includes("--apply");

type ApiFixture = {
  fixture: { id: number };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
};

type ApiStat = { type: string; value: number | string | null };
type ApiTeamStats = {
  team: { id: number; name: string };
  statistics: ApiStat[];
};

function parsePercent(v: number | string | null): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v > 1 ? v / 100 : v;
  const n = parseFloat(v.replace("%", "").trim());
  if (Number.isNaN(n)) return null;
  return n > 1 ? n / 100 : n;
}
function parseInt2(v: number | string | null): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Math.round(v);
  const n = parseInt(v.trim(), 10);
  return Number.isNaN(n) ? null : n;
}
function parseFloat2(v: number | string | null): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const n = parseFloat(v.trim());
  return Number.isNaN(n) ? null : n;
}

function mapStats(rows: ApiStat[]) {
  const out: Record<string, number | null> = {
    possession: null, shots: null, shotsOnTarget: null,
    corners: null, fouls: null, offsides: null,
    xG: null, passes: null, passAccuracy: null,
  };
  for (const r of rows) {
    const t = r.type.toLowerCase();
    if (t === "ball possession") out.possession = parsePercent(r.value);
    else if (t === "total shots") out.shots = parseInt2(r.value);
    else if (t === "shots on goal") out.shotsOnTarget = parseInt2(r.value);
    else if (t === "corner kicks") out.corners = parseInt2(r.value);
    else if (t === "fouls") out.fouls = parseInt2(r.value);
    else if (t === "offsides") out.offsides = parseInt2(r.value);
    else if (t === "expected_goals") out.xG = parseFloat2(r.value);
    else if (t === "total passes") out.passes = parseInt2(r.value);
    else if (t === "passes %") out.passAccuracy = parsePercent(r.value);
  }
  return out;
}

function hasAny(s: Record<string, number | null>): boolean {
  return Object.values(s).some((v) => v != null);
}

async function main() {
  if (!process.env.API_FOOTBALL_KEY) throw new Error("API_FOOTBALL_KEY not set");
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL must be set");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const candidates = await prisma.match.findMany({
      where: {
        externalApiId: { not: null },
        status: { in: ["FINISHED", "LIVE"] },
      },
      include: { homeTeam: true, awayTeam: true, stats: true },
      orderBy: { matchNumber: "asc" },
    });
    const needs = candidates.filter((m) => m.stats.length < 2);
    console.log(`${candidates.length} with externalApiId · ${needs.length} need backfill\n`);

    if (!APPLY) {
      for (const m of needs) {
        console.log(`· #${m.matchNumber} ${m.homeTeam.shortName}-${m.awayTeam.shortName}  (${m.status})`);
      }
      console.log("\nDry run. Re-run with --apply to fetch and upsert.");
      return;
    }

    let ok = 0;
    let failed = 0;
    for (const m of needs) {
      try {
        const fxr = await apiFootball<{ response?: ApiFixture[] }>(
          `/fixtures?id=${m.externalApiId}`,
        );
        const fixture = fxr.response?.[0];
        if (!fixture) {
          console.log(`  ! #${m.matchNumber}: no fixture from API`);
          failed += 1;
          continue;
        }
        const sr = await apiFootball<{ response?: ApiTeamStats[] }>(
          `/fixtures/statistics?fixture=${m.externalApiId}`,
        );
        const rows = sr.response ?? [];

        let upserted = 0;
        for (const row of rows) {
          let internalTeamId: string | null = null;
          if (row.team.id === fixture.teams.home.id) internalTeamId = m.homeTeamId;
          else if (row.team.id === fixture.teams.away.id) internalTeamId = m.awayTeamId;
          if (!internalTeamId) continue;

          const mapped = mapStats(row.statistics);
          if (!hasAny(mapped)) continue;

          await prisma.matchStat.upsert({
            where: { matchId_teamId: { matchId: m.id, teamId: internalTeamId } },
            create: { matchId: m.id, teamId: internalTeamId, ...mapped },
            update: mapped,
          });
          upserted += 1;
        }
        console.log(`  → #${m.matchNumber} ${m.homeTeam.shortName}-${m.awayTeam.shortName}: ${upserted} team row(s)`);
        ok += 1;
      } catch (err) {
        console.log(`  ! #${m.matchNumber}: ${(err as Error).message}`);
        failed += 1;
      }
    }
    console.log(`\nDone. ${ok} succeeded, ${failed} failed.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
