import type { MatchStatus, MatchStage, Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

export type MatchFilters = {
  date?: Date;
  group?: string;
  teamId?: string;
  stage?: MatchStage;
  status?: MatchStatus;
};

export async function listMatches(filters: MatchFilters = {}) {
  const where: Prisma.MatchWhereInput = {};

  if (filters.group) where.groupCode = filters.group;
  if (filters.stage) where.stage = filters.stage;
  if (filters.status) where.status = filters.status;

  if (filters.teamId) {
    where.OR = [
      { homeTeamId: filters.teamId },
      { awayTeamId: filters.teamId },
    ];
  }

  if (filters.date) {
    const start = new Date(filters.date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    where.kickoffAt = { gte: start, lt: end };
  }

  return prisma.match.findMany({
    where,
    include: {
      homeTeam: true,
      awayTeam: true,
      venue: true,
    },
    orderBy: [{ kickoffAt: "asc" }, { matchNumber: "asc" }],
  });
}

export async function getMatchById(id: string) {
  return prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      venue: true,
      events: {
        orderBy: [{ minute: "asc" }, { id: "asc" }],
        include: { player: true, relatedPlayer: true, team: true },
      },
      stats: { include: { team: true } },
    },
  });
}

export async function getMatchByNumber(matchNumber: number) {
  return prisma.match.findUnique({
    where: { matchNumber },
    include: { homeTeam: true, awayTeam: true, venue: true },
  });
}
