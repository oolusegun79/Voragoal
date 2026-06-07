import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { prisma } from "@/server/db";
import { getMatchById } from "@/server/services/matchService";
import { LiveEntryPanel } from "@/components/admin/live/LiveEntryPanel";
import { FlagIcon } from "@/components/team/FlagIcon";

export default async function LiveEntryPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const match = await getMatchById(matchId);
  if (!match) notFound();

  const [homeSquad, awaySquad] = await Promise.all([
    prisma.player.findMany({
      where: { teamId: match.homeTeamId },
      orderBy: [{ position: "asc" }, { shirtNumber: "asc" }],
    }),
    prisma.player.findMany({
      where: { teamId: match.awayTeamId },
      orderBy: [{ position: "asc" }, { shirtNumber: "asc" }],
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/matches/${match.id}/events`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Deliberate editor
        </Link>
        <Link
          href="/admin/matches"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          All matches
        </Link>
      </div>

      <header className="mt-4">
        <h1 className="text-lg font-semibold tracking-tight">
          <span aria-hidden><FlagIcon emoji={match.homeTeam.flagEmoji} /></span> {match.homeTeam.shortName}{" "}
          <span className="text-muted-foreground">vs</span>{" "}
          {match.awayTeam.shortName} <span aria-hidden><FlagIcon emoji={match.awayTeam.flagEmoji} /></span>
        </h1>
        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Pencil className="size-3" /> Live entry mode · big tap targets · auto-saves
        </p>
      </header>

      <div className="mt-6">
        <LiveEntryPanel
          match={match}
          home={{ team: match.homeTeam, players: homeSquad }}
          away={{ team: match.awayTeam, players: awaySquad }}
          initialEvents={match.events}
        />
      </div>
    </div>
  );
}
