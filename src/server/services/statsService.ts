import { prisma } from "@/server/db";

const GOAL_TYPES = ["GOAL", "PENALTY_GOAL"] as const;

export async function getTournamentKpis() {
  const now = new Date();
  const sevenDaysOut = new Date(now);
  sevenDaysOut.setUTCDate(sevenDaysOut.getUTCDate() + 7);

  const [totalMatches, finishedMatches, totalGoals, upcomingThisWeek] = await Promise.all([
    prisma.match.count(),
    prisma.match.count({ where: { status: "FINISHED" } }),
    prisma.matchEvent.count({ where: { type: { in: [...GOAL_TYPES, "OWN_GOAL"] } } }),
    prisma.match.count({
      where: { status: "SCHEDULED", kickoffAt: { gte: now, lt: sevenDaysOut } },
    }),
  ]);

  const topScorer = await getTopScorer();

  return {
    totalMatches,
    finishedMatches,
    totalGoals,
    upcomingThisWeek,
    topScorer,
  };
}

export async function getTopScorer() {
  const grouped = await prisma.matchEvent.groupBy({
    by: ["playerId"],
    where: { type: { in: [...GOAL_TYPES] }, playerId: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { playerId: "desc" } },
    take: 1,
  });
  const top = grouped[0];
  if (!top || !top.playerId) return null;
  const player = await prisma.player.findUnique({
    where: { id: top.playerId },
    include: { team: true },
  });
  if (!player) return null;
  return { player, goals: top._count._all };
}

export type GoalsByTeam = {
  teamId: string;
  shortName: string;
  flagEmoji: string;
  accentColor: string;
  goals: number;
};

export async function getGoalsByTeam(limit = 10): Promise<GoalsByTeam[]> {
  const grouped = await prisma.matchEvent.groupBy({
    by: ["teamId"],
    where: { type: { in: [...GOAL_TYPES] } },
    _count: { _all: true },
    orderBy: { _count: { teamId: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];
  const teams = await prisma.team.findMany({
    where: { id: { in: grouped.map((g) => g.teamId) } },
  });
  const byId = new Map(teams.map((t) => [t.id, t]));
  return grouped
    .map((g) => {
      const t = byId.get(g.teamId);
      if (!t) return null;
      return {
        teamId: t.id,
        shortName: t.shortName,
        flagEmoji: t.flagEmoji,
        accentColor: t.accentColor,
        goals: g._count._all,
      } satisfies GoalsByTeam;
    })
    .filter((x): x is GoalsByTeam => x !== null);
}

export type TopScorerRow = {
  playerId: string;
  name: string;
  shortName: string;
  flagEmoji: string;
  goals: number;
};

export async function getTopScorers(limit = 10): Promise<TopScorerRow[]> {
  const grouped = await prisma.matchEvent.groupBy({
    by: ["playerId"],
    where: { type: { in: [...GOAL_TYPES] }, playerId: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { playerId: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];
  const players = await prisma.player.findMany({
    where: { id: { in: grouped.map((g) => g.playerId!).filter(Boolean) } },
    include: { team: true },
  });
  const byId = new Map(players.map((p) => [p.id, p]));
  return grouped
    .map((g) => {
      const p = g.playerId ? byId.get(g.playerId) : undefined;
      if (!p) return null;
      return {
        playerId: p.id,
        name: p.knownAs ?? p.fullName,
        shortName: p.team.shortName,
        flagEmoji: p.team.flagEmoji,
        goals: g._count._all,
      } satisfies TopScorerRow;
    })
    .filter((x): x is TopScorerRow => x !== null);
}

export type ResultsSplit = { wins: number; draws: number; losses: number };

export async function getResultsSplit(): Promise<ResultsSplit> {
  const matches = await prisma.match.findMany({
    where: { status: "FINISHED", homeScore: { not: null }, awayScore: { not: null } },
    select: { homeScore: true, awayScore: true },
  });
  let wins = 0;
  let draws = 0;
  for (const m of matches) {
    const h = m.homeScore ?? 0;
    const a = m.awayScore ?? 0;
    if (h === a) draws += 1;
    else wins += 1;
  }
  // For a tournament with no draws differentiation between home/away "wins/losses",
  // we model it as Decisive vs Draw — keep simple shape for the donut.
  return { wins, draws, losses: 0 };
}

export async function getUpcomingMatches(limit = 5) {
  return prisma.match.findMany({
    where: { status: "SCHEDULED", kickoffAt: { gte: new Date() } },
    include: { homeTeam: true, awayTeam: true, venue: true },
    orderBy: [{ kickoffAt: "asc" }, { matchNumber: "asc" }],
    take: limit,
  });
}

export async function getNextMatchForTeam(teamId: string) {
  return prisma.match.findFirst({
    where: {
      status: "SCHEDULED",
      kickoffAt: { gte: new Date() },
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    include: { homeTeam: true, awayTeam: true, venue: true },
    orderBy: { kickoffAt: "asc" },
  });
}
