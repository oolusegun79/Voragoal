import { createHash } from "node:crypto";
import { prisma } from "@/server/db";

/** Stable JSON.stringify: keys sorted recursively. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object" && !(v instanceof Date)) {
    const obj = v as Record<string, unknown>;
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys(obj[k]);
        return acc;
      }, {});
  }
  return v;
}

export function hashFacts(facts: unknown): string {
  return createHash("sha256").update(canonicalJson(facts)).digest("hex");
}

// ---- Match facts ----

export async function buildMatchFacts(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      venue: true,
      events: {
        orderBy: [{ minute: "asc" }],
        include: { team: true, player: true, relatedPlayer: true },
      },
      stats: { include: { team: true } },
    },
  });
  if (!match) return null;

  return {
    subject: "MATCH" as const,
    stage: match.stage,
    groupCode: match.groupCode,
    kickoffAt: match.kickoffAt.toISOString(),
    status: match.status,
    home: {
      id: match.homeTeam.id,
      name: match.homeTeam.name,
      shortName: match.homeTeam.shortName,
      score: match.homeScore,
    },
    away: {
      id: match.awayTeam.id,
      name: match.awayTeam.name,
      shortName: match.awayTeam.shortName,
      score: match.awayScore,
    },
    venue: match.venue
      ? { name: match.venue.name, city: match.venue.city, country: match.venue.country }
      : null,
    events: match.events.map((e) => ({
      minute: e.minute,
      addedMinute: e.addedMinute,
      type: e.type,
      team: e.team.shortName,
      player: e.player?.knownAs ?? e.player?.fullName ?? null,
      relatedPlayer: e.relatedPlayer?.knownAs ?? e.relatedPlayer?.fullName ?? null,
      detail: e.detail,
    })),
    stats: match.stats.map((s) => ({
      team: s.team.shortName,
      possession: s.possession,
      shots: s.shots,
      shotsOnTarget: s.shotsOnTarget,
      corners: s.corners,
      fouls: s.fouls,
      offsides: s.offsides,
      xG: s.xG,
      passes: s.passes,
      passAccuracy: s.passAccuracy,
    })),
  };
}

// ---- Team facts ----

export async function buildTeamFacts(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      squad: { select: { id: true, knownAs: true, fullName: true, position: true } },
    },
  });
  if (!team) return null;

  const matches = await prisma.match.findMany({
    where: { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoffAt: "asc" },
  });
  const finished = matches.filter((m) => m.status === "FINISHED");

  let won = 0, drawn = 0, lost = 0, gf = 0, ga = 0;
  for (const m of finished) {
    const isHome = m.homeTeamId === teamId;
    const myScore = (isHome ? m.homeScore : m.awayScore) ?? 0;
    const oppScore = (isHome ? m.awayScore : m.homeScore) ?? 0;
    gf += myScore;
    ga += oppScore;
    if (myScore > oppScore) won += 1;
    else if (myScore < oppScore) lost += 1;
    else drawn += 1;
  }

  // Goal events scored by this team's players.
  const goalEvents = await prisma.matchEvent.findMany({
    where: {
      teamId,
      type: { in: ["GOAL", "PENALTY_GOAL"] },
      playerId: { not: null },
    },
    include: { player: true },
  });
  const scorerTotals = new Map<string, number>();
  for (const e of goalEvents) {
    const name = e.player?.knownAs ?? e.player?.fullName ?? "Unknown";
    scorerTotals.set(name, (scorerTotals.get(name) ?? 0) + 1);
  }
  const topScorers = [...scorerTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, goals]) => ({ name, goals }));

  return {
    subject: "TEAM" as const,
    team: {
      id: team.id,
      name: team.name,
      groupCode: team.groupCode,
      fifaRanking: team.fifaRanking,
      manager: team.manager,
      squadSize: team.squad.length,
    },
    record: { played: finished.length, won, drawn, lost, gf, ga, gd: gf - ga, points: won * 3 + drawn },
    upcomingCount: matches.filter((m) => m.status === "SCHEDULED").length,
    finishedMatches: finished.map((m) => ({
      kickoffAt: m.kickoffAt.toISOString(),
      home: { team: m.homeTeam.shortName, score: m.homeScore },
      away: { team: m.awayTeam.shortName, score: m.awayScore },
    })),
    topScorers,
  };
}

// ---- Player facts ----

export async function buildPlayerFacts(playerId: string) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { team: true },
  });
  if (!player) return null;

  const events = await prisma.matchEvent.findMany({
    where: { OR: [{ playerId }, { relatedPlayerId: playerId }] },
    include: {
      match: { include: { homeTeam: true, awayTeam: true } },
    },
    orderBy: [{ matchId: "asc" }, { minute: "asc" }],
  });

  let goals = 0, assists = 0, yellows = 0, reds = 0;
  for (const e of events) {
    if (e.playerId === playerId) {
      if (e.type === "GOAL" || e.type === "PENALTY_GOAL") goals += 1;
      else if (e.type === "YELLOW_CARD") yellows += 1;
      else if (e.type === "RED_CARD") reds += 1;
    }
    if (
      e.relatedPlayerId === playerId &&
      (e.type === "GOAL" || e.type === "PENALTY_GOAL")
    ) {
      assists += 1;
    }
  }

  // Per-match contributions.
  const byMatch = new Map<string, { match: string; minute: number; type: string }[]>();
  for (const e of events) {
    if (e.playerId !== playerId && e.relatedPlayerId !== playerId) continue;
    const key = `${e.match.homeTeam.shortName}-${e.match.awayTeam.shortName}`;
    const list = byMatch.get(key) ?? [];
    list.push({
      match: key,
      minute: e.minute,
      type: e.relatedPlayerId === playerId ? "ASSIST" : e.type,
    });
    byMatch.set(key, list);
  }

  return {
    subject: "PLAYER" as const,
    player: {
      id: player.id,
      name: player.knownAs ?? player.fullName,
      fullName: player.fullName,
      team: player.team.shortName,
      position: player.position,
      shirtNumber: player.shirtNumber,
      club: player.club,
    },
    totals: { goals, assists, yellows, reds },
    perMatch: [...byMatch.entries()].map(([key, entries]) => ({ match: key, entries })),
  };
}
