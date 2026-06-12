import type { EventType } from "@prisma/client";
import { prisma } from "@/server/db";
import { createEvent } from "@/server/services/eventsService";

const API_BASE = "https://v3.football.api-sports.io";

type ApiPlayer = { id: number | null; name: string | null };

type ApiEvent = {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: ApiPlayer;
  assist: ApiPlayer;
  type: string;
  detail: string;
  comments: string | null;
};

type ApiFixture = {
  fixture: { id: number };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  events?: ApiEvent[];
};

type ApiFixturesResponse = {
  errors?: unknown;
  response?: ApiFixture[];
};

export type SyncSummary = {
  matchId: string;
  attempted: number;
  inserted: number;
  skipped: number;
  errors: string[];
};

export type SyncAllSummary = {
  matchesProcessed: number;
  matches: SyncSummary[];
};

export function isApiFeedConfigured(): boolean {
  return Boolean(process.env.API_FOOTBALL_KEY);
}

async function apiFootball<T>(path: string): Promise<T> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY not configured");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "x-apisports-key": key },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API-Football ${res.status}: ${await res.text().catch(() => "")}`);
  }
  return res.json() as Promise<T>;
}

async function fetchFixture(externalApiId: string): Promise<ApiFixture | null> {
  const data = await apiFootball<ApiFixturesResponse>(
    `/fixtures?id=${encodeURIComponent(externalApiId)}`,
  );
  return data.response?.[0] ?? null;
}

function mapType(apiType: string, apiDetail: string): EventType | null {
  const t = apiType.toLowerCase();
  const d = (apiDetail ?? "").toLowerCase();
  if (t === "goal") {
    if (d.includes("own")) return "OWN_GOAL";
    if (d.includes("missed")) return "PENALTY_MISS";
    if (d.includes("penalty")) return "PENALTY_GOAL";
    return "GOAL";
  }
  if (t === "card") {
    if (d.includes("red") || d.includes("second yellow")) return "RED_CARD";
    if (d.includes("yellow")) return "YELLOW_CARD";
    return null;
  }
  if (t === "subst") return "SUB_IN";
  if (t === "var") return "VAR";
  return null;
}

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
    select: { id: true, fullName: true, knownAs: true, externalApiId: true },
  });

  const matches = candidates.filter((p) => {
    const fullLast = lastNameNormalized(p.fullName);
    const knownLast = p.knownAs ? lastNameNormalized(p.knownAs) : "";
    return fullLast === target || knownLast === target;
  });

  if (matches.length !== 1) return null;

  const picked = matches[0];
  if (apiPlayerId != null && picked.externalApiId !== String(apiPlayerId)) {
    await prisma.player.update({
      where: { id: picked.id },
      data: { externalApiId: String(apiPlayerId) },
    });
  }
  return picked.id;
}

function eventKey(
  externalMatchId: string,
  apiEvent: ApiEvent,
  mappedType: EventType,
  internalTeamId: string,
): string {
  // Use stable identifiers only. player.id is constant across polls, whereas
  // player.name can shift between short ("C. Soucek") and full ("Tomáš Souček")
  // form as API-Football refines the record. time.extra also flips from null
  // to a number as injury time gets finalised, so we exclude it too — within
  // a single match-minute, a player can't be the actor of two events of the
  // same type for the same team.
  const minute = apiEvent.time.elapsed;
  const playerId = apiEvent.player?.id ?? "x";
  return [externalMatchId, minute, mappedType, internalTeamId, playerId].join("|");
}

export async function syncMatchFromFeed(matchId: string): Promise<SyncSummary> {
  const summary: SyncSummary = { matchId, attempted: 0, inserted: 0, skipped: 0, errors: [] };

  if (!isApiFeedConfigured()) {
    summary.errors.push("API_FOOTBALL_KEY not configured");
    return summary;
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      externalApiId: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  });
  if (!match) {
    summary.errors.push("Match not found");
    return summary;
  }
  if (!match.externalApiId) {
    summary.errors.push("Match has no externalApiId");
    return summary;
  }

  let fixture: ApiFixture | null;
  try {
    fixture = await fetchFixture(match.externalApiId);
  } catch (err) {
    summary.errors.push(`fetch failed: ${(err as Error).message}`);
    return summary;
  }
  if (!fixture) {
    summary.errors.push("API returned no fixture");
    return summary;
  }

  const apiHomeId = fixture.teams.home.id;
  const apiAwayId = fixture.teams.away.id;
  const events = fixture.events ?? [];

  for (const ev of events) {
    summary.attempted += 1;

    const mappedType = mapType(ev.type, ev.detail);
    if (!mappedType) {
      summary.skipped += 1;
      continue;
    }

    let internalTeamId: string | null = null;
    if (ev.team.id === apiHomeId) internalTeamId = match.homeTeamId;
    else if (ev.team.id === apiAwayId) internalTeamId = match.awayTeamId;
    if (!internalTeamId) {
      summary.errors.push(`team ${ev.team.id} (${ev.team.name}) outside fixture pair`);
      summary.skipped += 1;
      continue;
    }

    const key = eventKey(match.externalApiId, ev, mappedType, internalTeamId);

    // Fast path: previously-imported event with the current key format.
    const byKey = await prisma.matchEvent.findUnique({
      where: {
        matchId_externalEventKey: { matchId: match.id, externalEventKey: key },
      },
      select: { id: true },
    });
    if (byKey) {
      summary.skipped += 1;
      continue;
    }

    const playerId = await resolvePlayer(internalTeamId, ev.player.id, ev.player.name);
    const relatedPlayerId =
      mappedType === "SUB_IN"
        ? await resolvePlayer(internalTeamId, ev.assist.id, ev.assist.name)
        : null;

    // Structural fallback: same event re-imported under an older key format,
    // a shifted player name, or a one-minute API correction. For "one-shot"
    // events (subs, cards) a player can only have one per match, so we ignore
    // minute entirely. For goals and VAR we keep minute but tolerate ±1
    // minute drift between API polls.
    const ONE_SHOT: EventType[] = ["SUB_IN", "SUB_OUT", "YELLOW_CARD", "RED_CARD"];
    const isOneShot = ONE_SHOT.includes(mappedType);
    const structural = await prisma.matchEvent.findFirst({
      where: {
        matchId: match.id,
        type: mappedType,
        teamId: internalTeamId,
        playerId: playerId,
        ...(isOneShot
          ? {}
          : { minute: { gte: ev.time.elapsed - 1, lte: ev.time.elapsed + 1 } }),
      },
      select: { id: true },
    });
    if (structural) {
      summary.skipped += 1;
      continue;
    }

    const detailParts: string[] = [];
    // VAR's whole purpose is in the detail string ("Goal cancelled",
    // "Penalty awarded", etc.). For other types the EventType already
    // encodes what the detail field would say, so we skip it.
    if (mappedType === "VAR" && ev.detail) detailParts.push(ev.detail);
    if (!playerId && ev.player.name) detailParts.push(`API player: ${ev.player.name}`);
    if (mappedType === "SUB_IN" && !relatedPlayerId && ev.assist.name) {
      detailParts.push(`API off: ${ev.assist.name}`);
    }
    if (ev.comments) detailParts.push(ev.comments);

    try {
      await createEvent({
        matchId: match.id,
        minute: ev.time.elapsed,
        addedMinute: ev.time.extra ?? null,
        type: mappedType,
        teamId: internalTeamId,
        playerId,
        relatedPlayerId,
        detail: detailParts.length > 0 ? detailParts.join(" · ").slice(0, 200) : null,
        externalEventKey: key,
        importedFromFeed: true,
      });
      summary.inserted += 1;
    } catch (err) {
      summary.errors.push(`insert failed (${mappedType} @ ${ev.time.elapsed}'): ${(err as Error).message}`);
    }
  }

  return summary;
}

export async function syncAllLiveMatches(): Promise<SyncAllSummary> {
  const live = await prisma.match.findMany({
    where: { status: "LIVE", externalApiId: { not: null } },
    select: { id: true },
  });

  const results = await Promise.allSettled(live.map((m) => syncMatchFromFeed(m.id)));
  const matches: SyncSummary[] = results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : {
          matchId: live[i].id,
          attempted: 0,
          inserted: 0,
          skipped: 0,
          errors: [(r.reason as Error)?.message ?? "unknown"],
        },
  );

  return { matchesProcessed: live.length, matches };
}
