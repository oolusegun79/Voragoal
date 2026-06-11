/**
 * Bulk-populate Match.externalApiId by matching seeded matches against
 * API-Football. Free tier blocks /fixtures?league=1&season=2026 — instead we
 * iterate over each unique kickoff date in our DB and call /fixtures?date=
 * (which IS accessible on Free), then client-filter to league.id === 1.
 *
 * Usage:
 *   pnpm tsx scripts/sync-fixture-ids.ts            # dry-run
 *   pnpm tsx scripts/sync-fixture-ids.ts --apply    # writes externalApiId
 *   pnpm tsx scripts/sync-fixture-ids.ts --apply --force
 *
 * Cost: one API call per unique match date (~39 calls for the 2026 WC).
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

loadEnv({ path: ".env.local", override: true });

const WC_LEAGUE_ID = 1;
const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");

type ApiFixture = {
  fixture: { id: number; date: string };
  league: { id: number; name: string; season: number };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
};
type ApiResponse = { errors?: unknown; response?: ApiFixture[] };

const TEAM_ALIASES: Record<string, string> = {
  "usa": "united states",
  "united states of america": "united states",
  "south korea": "korea republic",
  "iran islamic republic": "iran",
  "ivory coast": "cote d'ivoire",
};

function norm(s: string): string {
  const base = s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
  return TEAM_ALIASES[base] ?? base;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

async function main() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY not set in .env.local");

  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL must be set");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const matches = await prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchNumber: "asc" },
    });
    console.log(`DB has ${matches.length} seeded matches.`);

    // Unique dates we need to fetch (+/- one day to absorb timezone drift)
    const dateSet = new Set<string>();
    for (const m of matches) {
      const d = new Date(m.kickoffAt);
      dateSet.add(dateKey(d));
      const dayBefore = new Date(d.getTime() - 24 * 3600 * 1000);
      const dayAfter = new Date(d.getTime() + 24 * 3600 * 1000);
      dateSet.add(dateKey(dayBefore));
      dateSet.add(dateKey(dayAfter));
    }
    const dates = [...dateSet].sort();
    console.log(`Will fetch ${dates.length} dates from API-Football.\n`);

    // Pull all WC fixtures across those dates
    const wcFixtures: ApiFixture[] = [];
    for (const d of dates) {
      const r = await fetch(`https://v3.football.api-sports.io/fixtures?date=${d}`, {
        headers: { "x-apisports-key": key },
      });
      if (!r.ok) {
        console.error(`  ! ${d} HTTP ${r.status}`);
        continue;
      }
      const j = (await r.json()) as ApiResponse;
      const onlyWc = (j.response ?? []).filter((f) => f.league.id === WC_LEAGUE_ID);
      console.log(`  ${d}: ${onlyWc.length} WC fixture${onlyWc.length === 1 ? "" : "s"}`);
      wcFixtures.push(...onlyWc);
    }

    // Dedupe by fixture id (in case +/- 1d windows return the same fixture twice)
    const fixtureMap = new Map<number, ApiFixture>();
    for (const f of wcFixtures) fixtureMap.set(f.fixture.id, f);
    const uniqueFixtures = [...fixtureMap.values()];
    console.log(`\nUnique WC fixtures collected: ${uniqueFixtures.length}\n`);

    // Index by normalized (home, away) team names
    const byPair = new Map<string, ApiFixture>();
    for (const f of uniqueFixtures) {
      const key = `${norm(f.teams.home.name)}|${norm(f.teams.away.name)}`;
      byPair.set(key, f);
    }

    let matched = 0;
    let skipped = 0;
    const unmatched: string[] = [];
    const dateWarnings: string[] = [];

    for (const m of matches) {
      if (m.externalApiId && !FORCE) {
        skipped += 1;
        continue;
      }
      const key = `${norm(m.homeTeam.name)}|${norm(m.awayTeam.name)}`;
      const f = byPair.get(key);
      if (!f) {
        unmatched.push(`Match ${m.matchNumber}: ${m.homeTeam.name} vs ${m.awayTeam.name}  [key=${key}]`);
        continue;
      }

      const driftHours = Math.abs(new Date(f.fixture.date).getTime() - m.kickoffAt.getTime()) / 3_600_000;
      if (driftHours > 36) {
        dateWarnings.push(
          `Match ${m.matchNumber}: db=${m.kickoffAt.toISOString()} api=${f.fixture.date} (${driftHours.toFixed(1)}h drift)`,
        );
        continue;
      }

      matched += 1;
      console.log(
        `${APPLY ? "→" : "·"} Match ${String(m.matchNumber).padStart(3, " ")}: ${m.homeTeam.shortName} vs ${m.awayTeam.shortName}  →  fixture ${f.fixture.id}`,
      );
      if (APPLY) {
        await prisma.match.update({
          where: { id: m.id },
          data: { externalApiId: String(f.fixture.id) },
        });
      }
    }

    console.log("");
    console.log(`Matched:    ${matched}`);
    console.log(`Skipped:    ${skipped}  (already had externalApiId; pass --force to overwrite)`);
    console.log(`Unmatched:  ${unmatched.length}`);
    for (const u of unmatched) console.log(`  - ${u}`);
    if (dateWarnings.length > 0) {
      console.log(`\nDate drift > 36h:`);
      for (const w of dateWarnings) console.log(`  - ${w}`);
    }

    console.log("");
    console.log(APPLY ? `Wrote ${matched} externalApiId values.` : "Dry run. Re-run with --apply to write to DB.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
