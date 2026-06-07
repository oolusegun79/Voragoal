import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/server/auth/config";
import { getPlayerById, getPlayerStats } from "@/server/services/playerService";
import { isPlayerFavorited } from "@/server/services/favoritesService";
import { FavoriteToggle } from "@/components/favorites/FavoriteToggle";
import { AiSummaryCard } from "@/components/ai/AiSummaryCard";

const POSITION_LABELS = {
  GK: "Goalkeeper",
  DF: "Defender",
  MF: "Midfielder",
  FW: "Forward",
} as const;

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const session = await auth();
  const [player, stats, isFav] = await Promise.all([
    getPlayerById(playerId),
    getPlayerStats(playerId),
    session?.user?.id ? isPlayerFavorited(session.user.id, playerId) : Promise.resolve(false),
  ]);
  if (!player) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link
        href={`/teams/${player.teamId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {player.team.name} squad
      </Link>

      <header className="mt-4 rounded-xl border border-border/60 bg-card p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="flex size-20 items-center justify-center rounded-full bg-card-muted text-3xl font-semibold">
              {player.shirtNumber ?? "—"}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {player.knownAs ?? player.fullName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                <span aria-hidden>{player.team.flagEmoji}</span> {player.team.name} · {POSITION_LABELS[player.position]}
                {player.club ? ` · ${player.club}` : ""}
              </p>
            </div>
          </div>
          <FavoriteToggle
            kind="player"
            id={player.id}
            initialFavorited={isFav}
            authenticated={Boolean(session?.user)}
          />
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Goals"    value={stats.goals} accent="primary" />
        <Stat label="Assists"  value={stats.assists} accent="accent" />
        <Stat label="Own goals" value={stats.ownGoals} />
        <Stat label="Yellows"   value={stats.yellows} accent="warning" />
        <Stat label="Reds"      value={stats.reds}    accent="error" />
      </section>

      <section className="mt-8">
        <AiSummaryCard
          subjectType="PLAYER"
          subjectId={player.id}
          title="AI insights"
          description={`A factual analytics paragraph on ${player.knownAs ?? player.fullName} based on their tournament events.`}
        />
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "primary" | "accent" | "warning" | "error";
}) {
  const color =
    accent === "primary" ? "text-primary"
      : accent === "accent" ? "text-accent"
      : accent === "warning" ? "text-warning"
      : accent === "error" ? "text-error"
      : "text-foreground";
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  );
}
