import { prisma } from "@/server/db";

export async function listTeams() {
  return prisma.team.findMany({
    orderBy: [{ groupCode: "asc" }, { fifaRanking: "asc" }, { name: "asc" }],
  });
}

export async function getTeamById(id: string) {
  return prisma.team.findUnique({
    where: { id },
    include: {
      squad: {
        orderBy: [{ position: "asc" }, { shirtNumber: "asc" }],
      },
    },
  });
}

export async function getTeamFixtures(teamId: string) {
  return prisma.match.findMany({
    where: {
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    include: { homeTeam: true, awayTeam: true, venue: true },
    orderBy: [{ kickoffAt: "asc" }],
  });
}
