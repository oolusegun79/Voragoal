import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/server/auth/config";
import { getTeamById, getTeamFixtures } from "@/server/services/teamService";
import { isTeamFavorited } from "@/server/services/favoritesService";
import { TeamCrest } from "@/components/team/TeamCrest";
import { FavoriteToggle } from "@/components/favorites/FavoriteToggle";
import { AiSummaryCard } from "@/components/ai/AiSummaryCard";
import { formatKickoff } from "@/lib/formatters";

const POSITION_LABELS = {
  GK: "Goalkeepers",
  DF: "Defenders",
  MF: "Midfielders",
  FW: "Forwards",
} as const;

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const session = await auth();
  const [team, fixtures, isFav] = await Promise.all([
    getTeamById(teamId),
    getTeamFixtures(teamId),
    session?.user?.id ? isTeamFavorited(session.user.id, teamId) : Promise.resolve(false),
  ]);
  if (!team) notFound();

  const byPos = {
    GK: team.squad.filter((p) => p.position === "GK"),
    DF: team.squad.filter((p) => p.position === "DF"),
    MF: team.squad.filter((p) => p.position === "MF"),
    FW: team.squad.filter((p) => p.position === "FW"),
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All teams
      </Link>

      <header
        className="mt-4 rounded-xl border border-border/60 bg-card p-8"
        style={{ borderLeftColor: team.accentColor, borderLeftWidth: 4 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            <span className="text-6xl" aria-hidden>{team.flagEmoji}</span>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{team.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {team.groupCode ? `Group ${team.groupCode}` : "—"}
                {team.fifaRanking ? ` · FIFA #${team.fifaRanking}` : ""}
                {team.manager ? ` · Coach: ${team.manager}` : ""}
              </p>
            </div>
          </div>
          <FavoriteToggle
            kind="team"
            id={team.id}
            initialFavorited={isFav}
            authenticated={Boolean(session?.user)}
          />
        </div>
      </header>

      {/* Squad */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-medium tracking-tight">Squad</h2>
        {team.squad.length === 0 ? (
          <p className="rounded-lg border border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
            Squad data not yet entered for this team.
          </p>
        ) : (
          <div className="space-y-6">
            {(Object.keys(byPos) as Array<keyof typeof byPos>).map((pos) =>
              byPos[pos].length === 0 ? null : (
                <div key={pos}>
                  <h3 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                    {POSITION_LABELS[pos]}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {byPos[pos].map((p) => (
                      <Link
                        key={p.id}
                        href={`/players/${p.id}`}
                        className="rounded-lg border border-border/60 bg-card p-4 transition hover:border-border"
                      >
                        <p className="flex items-center gap-2">
                          {p.shirtNumber != null ? (
                            <span className="inline-flex size-6 items-center justify-center rounded bg-card-muted font-mono text-xs">
                              {p.shirtNumber}
                            </span>
                          ) : null}
                          <span className="truncate font-medium">{p.knownAs ?? p.fullName}</span>
                        </p>
                        {p.club ? (
                          <p className="mt-1 truncate text-xs text-muted-foreground">{p.club}</p>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* Fixtures */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-medium tracking-tight">Fixtures</h2>
        {fixtures.length === 0 ? (
          <p className="rounded-lg border border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
            No fixtures scheduled.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
            {fixtures.map((m) => {
              const finished = m.status === "FINISHED";
              return (
                <Link
                  key={m.id}
                  href={`/matches/${m.id}`}
                  className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-4 border-b border-border/40 px-4 py-3 transition last:border-b-0 hover:bg-card-muted"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatKickoff(m.kickoffAt)}
                  </span>
                  <div className="flex items-center justify-end">
                    <TeamCrest
                      flagEmoji={m.homeTeam.flagEmoji}
                      shortName={m.homeTeam.shortName}
                      accentColor={m.homeTeam.accentColor}
                      size="sm"
                    />
                  </div>
                  <span className="font-mono text-sm tabular-nums">
                    {finished ? `${m.homeScore} – ${m.awayScore}` : "vs"}
                  </span>
                  <div className="flex items-center">
                    <TeamCrest
                      flagEmoji={m.awayTeam.flagEmoji}
                      shortName={m.awayTeam.shortName}
                      accentColor={m.awayTeam.accentColor}
                      size="sm"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{m.venue?.name ?? ""}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-10">
        <AiSummaryCard
          subjectType="TEAM"
          subjectId={team.id}
          title="AI insights"
          description={`A factual summary of ${team.name}'s tournament so far. Updates as matches finish.`}
        />
      </section>
    </div>
  );
}
