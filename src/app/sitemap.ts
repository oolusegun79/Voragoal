import type { MetadataRoute } from "next";
import { prisma } from "@/server/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "https://voragoal.com";

  const [teams, players, matches] = await Promise.all([
    prisma.team.findMany({ select: { id: true } }),
    prisma.player.findMany({ select: { id: true } }),
    prisma.match.findMany({ select: { id: true, kickoffAt: true } }),
  ]);

  const staticUrls: MetadataRoute.Sitemap = [
    "/",
    "/matches",
    "/teams",
    "/standings",
    "/bracket",
    "/pricing",
    "/privacy",
    "/terms",
  ].map((p) => ({ url: `${base}${p}`, changeFrequency: "daily", priority: p === "/" ? 1 : 0.8 }));

  const teamUrls: MetadataRoute.Sitemap = teams.map((t) => ({
    url: `${base}/teams/${t.id}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const playerUrls: MetadataRoute.Sitemap = players.map((p) => ({
    url: `${base}/players/${p.id}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const matchUrls: MetadataRoute.Sitemap = matches.map((m) => ({
    url: `${base}/matches/${m.id}`,
    lastModified: m.kickoffAt,
    changeFrequency: "hourly",
    priority: 0.6,
  }));

  return [...staticUrls, ...teamUrls, ...playerUrls, ...matchUrls];
}
