import { prisma } from "@/server/db";

export async function getPlayerById(id: string) {
  return prisma.player.findUnique({
    where: { id },
    include: { team: true },
  });
}

export async function getPlayerStats(id: string) {
  const events = await prisma.matchEvent.findMany({
    where: { OR: [{ playerId: id }, { relatedPlayerId: id }] },
    include: { match: { include: { homeTeam: true, awayTeam: true } } },
  });

  const goals = events.filter(
    (e) =>
      e.playerId === id &&
      (e.type === "GOAL" || e.type === "PENALTY_GOAL")
  ).length;

  const ownGoals = events.filter(
    (e) => e.playerId === id && e.type === "OWN_GOAL"
  ).length;

  const assists = events.filter(
    (e) =>
      e.relatedPlayerId === id &&
      (e.type === "GOAL" || e.type === "PENALTY_GOAL")
  ).length;

  const yellows = events.filter(
    (e) => e.playerId === id && e.type === "YELLOW_CARD"
  ).length;

  const reds = events.filter(
    (e) => e.playerId === id && e.type === "RED_CARD"
  ).length;

  return { goals, ownGoals, assists, yellows, reds };
}
