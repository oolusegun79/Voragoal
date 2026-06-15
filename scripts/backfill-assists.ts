/**
 * Backfill ASSIST MatchEvent rows for any FINISHED Match that has
 * externalApiId set. The feed importer now emits ASSIST events alongside
 * goals, but matches that finished before that wire-up have no ASSIST data —
 * this re-pulls /fixtures?id= for each and creates the missing rows.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-assists.ts            # dry-run, list candidates
 *   pnpm tsx scripts/backfill-assists.ts --apply    # actually insert
 *
 * Cost: 1 API-Football call per finished match. With 64 matches across the
 * full WC that's 64 calls — trivial against the daily 7500 budget.
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

loadEnv({ path: ".env.local", override: true });

import { apiFootball } from "@/server/api-football/client";

const APPLY = process.argv.includes("--apply");

type ApiPlayer = { id: number | null; name: string | null };
type ApiEvent = {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: ApiPlayer;
  assist: ApiPlayer;
  type: string;
  detail: string;
};
type ApiFixture = {
  fixture: { id: number };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  events?: ApiEvent[];
};
type ApiResponse = { errors?: unknown; response?: ApiFixture[] };

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
function lastNameNormalized(fullName: string): string {
  const parts = normalizeName(fullName).split(/\s+/);
  return parts[parts.length - 1] ?? "";
}

async function resolvePlayer(
  prisma: PrismaClient,
  teamId: string,
  apiPlayerId: number | null,
  apiName: string | null,
): Promise<string | null> {
  if (!apiName && apiPlayerId == null) return null;
  if (apiPlayerId != null) {
    const bound = await prisma.player.findFirst({
      where: { teamId, externalApiId: String(apiPlayerId) },
      select: { id: true },
    });
    if (bound) return bound.id;
  }
  if (!apiName) return null;
  const target = lastNameNormalized(apiName);
  if (!target) return null;
  const candidates = await prisma.player.findMany({
    where: { teamId },
    select: { id: true, fullName: true, knownAs: true },
  });
  const matches = candidates.filter((p) => {
    const fullLast = lastNameNormalized(p.fullName);
    const knownLast = p.knownAs ? lastNameNormalized(p.knownAs) : "";
    return fullLast === target || knownLast === target;
  });
  if (matches.length !== 1) return null;
  return matches[0].id;
}

async function main() {
  if (!process.env.API_FOOTBALL_KEY) {
    throw new Error("API_FOOTBALL_KEY not set in .env.local");
  }
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL must be set");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const matches = await prisma.match.findMany({
      where: { status: "FINISHED", externalApiId: { not: null } },
      orderBy: { kickoffAt: "asc" },
    });
    console.log(`${matches.length} finished match(es) with externalApiId.\n`);
    if (matches.length === 0) return;

    let plannedInserts = 0;
    let plannedSkips = 0;

    for (const m of matches) {
      if (!m.externalApiId) continue;
      let resp: ApiResponse;
      try {
        resp = await apiFootball<ApiResponse>(
          `/fixtures?id=${encodeURIComponent(m.externalApiId)}`,
        );
      } catch (err) {
        console.error(`  ! ${m.matchNumber}: ${(err as Error).message}`);
        continue;
      }
      const fixture = resp.response?.[0];
      if (!fixture) {
        console.error(`  ! ${m.matchNumber}: no fixture body returned`);
        continue;
      }

      const apiHomeId = fixture.teams.home.id;
      const apiAwayId = fixture.teams.away.id;
      const events = fixture.events ?? [];

      let matchInserts = 0;
      for (const ev of events) {
        const ty = ev.type.toLowerCase();
        if (ty !== "goal") continue;
        // Skip own goals and penalty misses — they don't have credited assists.
        const detail = (ev.detail ?? "").toLowerCase();
        if (detail.includes("own") || detail.includes("missed")) continue;
        if (ev.assist.id == null) continue;

        let internalTeamId: string | null = null;
        if (ev.team.id === apiHomeId) internalTeamId = m.homeTeamId;
        else if (ev.team.id === apiAwayId) internalTeamId = m.awayTeamId;
        if (!internalTeamId) continue;

        const scorerId = await resolvePlayer(
          prisma,
          internalTeamId,
          ev.player.id,
          ev.player.name,
        );
        const assistPlayerId = await resolvePlayer(
          prisma,
          internalTeamId,
          ev.assist.id,
          ev.assist.name,
        );
        if (!assistPlayerId || assistPlayerId === scorerId) continue;

        const minute = ev.time.elapsed;
        const goalKey = [
          m.externalApiId,
          minute,
          ev.player.id ?? "x",
          internalTeamId,
        ].join("|");
        const assistKey = [
          m.externalApiId,
          minute,
          "GOAL",
          internalTeamId,
          ev.player.id ?? "x",
        ].join("|") + "-assist";

        const existing = await prisma.matchEvent.findUnique({
          where: {
            matchId_externalEventKey: {
              matchId: m.id,
              externalEventKey: assistKey,
            },
          },
          select: { id: true },
        });
        if (existing) {
          plannedSkips += 1;
          continue;
        }

        plannedInserts += 1;
        matchInserts += 1;

        if (APPLY) {
          try {
            await prisma.matchEvent.create({
              data: {
                matchId: m.id,
                minute,
                addedMinute: ev.time.extra ?? null,
                type: "ASSIST",
                teamId: internalTeamId,
                playerId: assistPlayerId,
                relatedPlayerId: scorerId,
                externalEventKey: assistKey,
                importedFromFeed: true,
              },
            });
          } catch (err) {
            console.error(
              `  ! insert failed @ ${minute}' in match ${m.matchNumber}: ${(err as Error).message}`,
            );
          }
        }
        // Suppress the unused-var lint for goalKey — kept for parity with feedImportService.ts
        void goalKey;
      }
      console.log(
        `  match ${m.matchNumber.toString().padStart(2, "0")}: ${matchInserts} assist event(s) to ${APPLY ? "insert" : "plan"}`,
      );
    }

    console.log(
      `\nDone. ${APPLY ? "Inserted" : "Would insert"}: ${plannedInserts}. Skipped (already present): ${plannedSkips}.`,
    );
    if (!APPLY) {
      console.log("Re-run with --apply to persist changes.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
