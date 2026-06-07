import { prisma } from "@/server/db";
import { getNextMatchForTeam } from "@/server/services/statsService";

export async function listFavoriteTeams(userId: string) {
  const rows = await prisma.favoriteTeam.findMany({
    where: { userId },
    include: { team: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => r.team);
}

export async function listFavoritePlayers(userId: string) {
  const rows = await prisma.favoritePlayer.findMany({
    where: { userId },
    include: { player: { include: { team: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => r.player);
}

export async function listSavedMatches(userId: string) {
  const rows = await prisma.savedMatch.findMany({
    where: { userId },
    include: {
      match: {
        include: { homeTeam: true, awayTeam: true, venue: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => r.match);
}

export async function isTeamFavorited(userId: string, teamId: string) {
  const row = await prisma.favoriteTeam.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  return Boolean(row);
}

export async function isPlayerFavorited(userId: string, playerId: string) {
  const row = await prisma.favoritePlayer.findUnique({
    where: { userId_playerId: { userId, playerId } },
  });
  return Boolean(row);
}

export async function isMatchSaved(userId: string, matchId: string) {
  const row = await prisma.savedMatch.findUnique({
    where: { userId_matchId: { userId, matchId } },
  });
  return Boolean(row);
}

export async function favoriteTeamsWithNext(userId: string) {
  const teams = await listFavoriteTeams(userId);
  return Promise.all(
    teams.map(async (t) => ({
      team: t,
      nextMatch: await getNextMatchForTeam(t.id),
    }))
  );
}
