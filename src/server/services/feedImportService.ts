import type { EventType } from "@prisma/client";
import { prisma } from "@/server/db";
import {
  createEvent,
  fullTime,
  recordHalfTime,
  setMatchStatus,
  startMatch,
} from "@/server/services/eventsService";

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
  fixture: {
    id: number;
    status: {
      short: string; // NS | 1H | HT | 2H | ET | BT | P | FT | AET | PEN | SUSP | INT | PST | CANC | ABD | AWD | WO | TBD
      elapsed: number | null;
      extra: number | null;
    };
  };
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

    // API-Football reports OWN_GOAL with team = beneficiary (the team that
    // gets the goal credited). Our model stores teamId = team that conceded
    // (the team of the player who scored it). Swap here so the player lookup
    // runs against the right squad and recomputeMatchScore credits correctly.
    if (mappedType === "OWN_GOAL") {
      internalTeamId =
        internalTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
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

export type TransitionEvent =
  | "kickoff"
  | "halftime"
  | "resume-2h"
  | "fulltime"
  | "postponed"
  | "cancelled";

export type AutoTransitionSummary = {
  scanned: number;
  transitions: Array<{ matchId: string; event: TransitionEvent }>;
  errors: string[];
};

/**
 * Drive Match state transitions from API-Football's live fixture state.
 *
 *   API status → DB action (idempotent, no-op if already applied)
 *   ----------------------------------------------------------------
 *   1H, HT, 2H, ET, BT, P     and status=SCHEDULED   → startMatch(kickoffStartedAt aligned to API.elapsed)
 *   HT                        and addedMinutes1H=null → recordHalfTime(addedMinutes1H=API.extra)
 *   2H, ET                    and secondHalfStartedAt=null → set secondHalfStartedAt aligned to API.elapsed
 *   FT, AET, PEN              and status=LIVE        → fullTime(addedMinutes2H=API.extra)
 *   PST, SUSP, INT            and status≠POSTPONED   → setMatchStatus(POSTPONED)
 *   CANC, ABD                 and status≠CANCELLED   → setMatchStatus(CANCELLED)
 *
 * Only runs for matches that have externalApiId set. Matches without a
 * fixture binding are handled by autoStartScheduledMatches (kickoff only).
 */
export async function autoTransitionMatches(): Promise<AutoTransitionSummary> {
  const summary: AutoTransitionSummary = { scanned: 0, transitions: [], errors: [] };

  if (!isApiFeedConfigured()) {
    summary.errors.push("API_FOOTBALL_KEY not configured");
    return summary;
  }

  const matches = await prisma.match.findMany({
    where: {
      externalApiId: { not: null },
      status: { in: ["SCHEDULED", "LIVE"] },
    },
    select: {
      id: true,
      externalApiId: true,
      status: true,
      kickoffStartedAt: true,
      secondHalfStartedAt: true,
      addedMinutes1H: true,
    },
  });
  summary.scanned = matches.length;

  for (const m of matches) {
    if (!m.externalApiId) continue;
    try {
      const fixture = await fetchFixture(m.externalApiId);
      if (!fixture) continue;
      const apiStatus = fixture.fixture.status.short;
      const apiElapsed = fixture.fixture.status.elapsed;
      const apiExtra = fixture.fixture.status.extra;

      const IN_PLAY = new Set(["1H", "HT", "2H", "ET", "BT", "P"]);
      const FINAL = new Set(["FT", "AET", "PEN", "AWD", "WO"]);
      const POSTPONED_LIKE = new Set(["PST", "SUSP", "INT"]);
      const CANCELLED_LIKE = new Set(["CANC", "ABD"]);

      // 1) SCHEDULED → LIVE (kickoff). Align kickoffStartedAt so our clock
      //    matches API.elapsed exactly, even if cron is late or broadcast delayed.
      if (m.status === "SCHEDULED" && IN_PLAY.has(apiStatus)) {
        const elapsedMin = apiElapsed ?? 0;
        const startedAt = new Date(Date.now() - elapsedMin * 60 * 1000);
        await startMatch(m.id, startedAt);
        summary.transitions.push({ matchId: m.id, event: "kickoff" });
      }

      // 2) HT — record added time so the clock pauses at 45'+X
      if (m.status === "LIVE" && apiStatus === "HT" && m.addedMinutes1H == null) {
        await recordHalfTime(m.id, apiExtra ?? 0);
        summary.transitions.push({ matchId: m.id, event: "halftime" });
      }

      // 3) Resume 2H — set secondHalfStartedAt back-calculated from API.elapsed
      if (m.status === "LIVE" && (apiStatus === "2H" || apiStatus === "ET") && !m.secondHalfStartedAt) {
        if (m.addedMinutes1H == null) {
          // Defensive: HT marker might be missing if API jumped 1H→2H between polls.
          await recordHalfTime(m.id, 0);
        }
        const elapsed = apiElapsed ?? 45;
        const sinceHalfStartMin = Math.max(0, elapsed - 45);
        const secondHalfStartedAt = new Date(Date.now() - sinceHalfStartMin * 60 * 1000);
        await prisma.match.update({
          where: { id: m.id },
          data: { secondHalfStartedAt },
        });
        summary.transitions.push({ matchId: m.id, event: "resume-2h" });
      }

      // 4) Full time
      if (m.status === "LIVE" && FINAL.has(apiStatus)) {
        await fullTime(m.id, apiExtra ?? 0);
        summary.transitions.push({ matchId: m.id, event: "fulltime" });
      }

      // 5) Postponed / cancelled
      if (m.status !== "POSTPONED" && POSTPONED_LIKE.has(apiStatus)) {
        await setMatchStatus(m.id, "POSTPONED");
        summary.transitions.push({ matchId: m.id, event: "postponed" });
      }
      if (m.status !== "CANCELLED" && CANCELLED_LIKE.has(apiStatus)) {
        await setMatchStatus(m.id, "CANCELLED");
        summary.transitions.push({ matchId: m.id, event: "cancelled" });
      }
    } catch (err) {
      summary.errors.push(`${m.id}: ${(err as Error).message ?? "unknown"}`);
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
