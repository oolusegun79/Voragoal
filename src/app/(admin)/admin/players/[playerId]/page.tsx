import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { prisma } from "@/server/db";
import { PlayerForm } from "@/components/admin/PlayerForm";
import { deletePlayerAction } from "../actions";

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const [player, teams] = await Promise.all([
    prisma.player.findUnique({ where: { id: playerId }, include: { team: true } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!player) notFound();

  const eventCount = await prisma.matchEvent.count({
    where: { OR: [{ playerId }, { relatedPlayerId: playerId }] },
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link
        href={`/admin/players?team=${player.teamId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Team players
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {player.knownAs ?? player.fullName}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        <span aria-hidden>{player.team.flagEmoji}</span> {player.team.name}
      </p>

      <div className="mt-6 rounded-xl border border-border/60 bg-card p-6">
        <PlayerForm teams={teams} existing={player} />
      </div>

      <div className="mt-6 rounded-xl border border-error/30 bg-card p-6">
        <h2 className="text-sm font-medium tracking-tight text-error">Danger zone</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {eventCount > 0
            ? `Disallowed: this player has ${eventCount} match event(s).`
            : "Player has no event history — safe to delete."}
        </p>
        <form action={deletePlayerAction} className="mt-3">
          <input type="hidden" name="id" value={player.id} />
          <button
            type="submit"
            disabled={eventCount > 0}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-error/40 bg-error/10 px-3 text-xs font-medium text-error transition hover:bg-error/15 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" /> Delete player
          </button>
        </form>
      </div>
    </div>
  );
}
