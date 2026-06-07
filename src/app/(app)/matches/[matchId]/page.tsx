import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Pencil } from "lucide-react";
import { auth } from "@/server/auth/config";
import { getMatchById } from "@/server/services/matchService";
import { getTeamById } from "@/server/services/teamService";
import { isMatchSaved } from "@/server/services/favoritesService";
import { FavoriteToggle } from "@/components/favorites/FavoriteToggle";
import { FlagIcon } from "@/components/team/FlagIcon";
import { MatchTabs, type TabKey } from "@/components/match/MatchTabs";
import { MatchTimeline } from "@/components/match/MatchTimeline";
import { MatchStatsTable } from "@/components/match/MatchStatsTable";
import { MatchLineups } from "@/components/match/MatchLineups";
import { LiveScorePoller } from "@/components/match/LiveScorePoller";
import { LiveMatchClock } from "@/components/admin/live/LiveMatchClock";
import { AiSummaryCard } from "@/components/ai/AiSummaryCard";
import { formatKickoff } from "@/lib/formatters";

const TABS: TabKey[] = ["timeline", "stats", "lineups", "ai"];

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { matchId } = await params;
  const sp = await searchParams;
  const tab: TabKey = (TABS as string[]).includes(sp.tab ?? "")
    ? (sp.tab as TabKey)
    : "timeline";

  const session = await auth();
  const [match, saved] = await Promise.all([
    getMatchById(matchId),
    session?.user?.id ? isMatchSaved(session.user.id, matchId) : Promise.resolve(false),
  ]);
  if (!match) notFound();

  const finished = match.status === "FINISHED";
  const live = match.status === "LIVE";
  const canEdit = session?.user?.role === "EDITOR" || session?.user?.role === "ADMIN";

  // For Lineups tab, fetch both squads.
  const [homeTeam, awayTeam] = tab === "lineups"
    ? await Promise.all([getTeamById(match.homeTeamId), getTeamById(match.awayTeamId)])
    : [null, null];

  const homeStats = match.stats.find((s) => s.teamId === match.homeTeamId) ?? null;
  const awayStats = match.stats.find((s) => s.teamId === match.awayTeamId) ?? null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <Link
          href="/matches"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All matches
        </Link>
        <div className="flex items-center gap-2">
          {canEdit ? (
            <Link
              href={`/admin/matches/${match.id}/events`}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/80 bg-card/40 px-3 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <Pencil className="size-3.5" /> Edit events
            </Link>
          ) : null}
          <FavoriteToggle
            kind="match"
            id={match.id}
            initialFavorited={saved}
            authenticated={Boolean(session?.user)}
            size="sm"
          />
        </div>
      </div>

      {/* Header card */}
      <section className="mt-4 rounded-xl border border-border/60 bg-card p-8">
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>
            {match.stage === "GROUP" && match.groupCode
              ? `Group ${match.groupCode}`
              : match.stage.replaceAll("_", " ")}
          </span>
          <span>·</span>
          <span>{formatKickoff(match.kickoffAt)}</span>
          {match.venue ? (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" /> {match.venue.name}, {match.venue.city}
              </span>
            </>
          ) : null}
          {match.attendance ? (
            <>
              <span>·</span>
              <span>{match.attendance.toLocaleString()} attendance</span>
            </>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-3 items-center gap-4">
          <div className="text-right">
            <Link href={`/teams/${match.homeTeam.id}`} className="inline-flex items-center gap-3">
              <span className="text-3xl" aria-hidden><FlagIcon emoji={match.homeTeam.flagEmoji} /></span>
              <span className="text-xl font-semibold">{match.homeTeam.shortName}</span>
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">{match.homeTeam.name}</p>
          </div>

          <div className="text-center">
            {finished || live ? (
              <div className="inline-flex flex-col items-center gap-1">
                <p className="font-mono text-5xl font-bold tabular-nums">
                  {match.homeScore ?? 0} <span className="text-muted-foreground">–</span> {match.awayScore ?? 0}
                </p>
                {live ? (
                  <LiveMatchClock
                    state={{
                      status: match.status,
                      kickoffStartedAt: match.kickoffStartedAt?.toISOString() ?? null,
                      secondHalfStartedAt: match.secondHalfStartedAt?.toISOString() ?? null,
                      addedMinutes1H: match.addedMinutes1H,
                    }}
                  />
                ) : null}
              </div>
            ) : (
              <p className="font-mono text-3xl text-muted-foreground">vs</p>
            )}
          </div>

          <div className="text-left">
            <Link href={`/teams/${match.awayTeam.id}`} className="inline-flex items-center gap-3">
              <span className="text-xl font-semibold">{match.awayTeam.shortName}</span>
              <span className="text-3xl" aria-hidden><FlagIcon emoji={match.awayTeam.flagEmoji} /></span>
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">{match.awayTeam.name}</p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="mt-6">
        <MatchTabs matchId={match.id} active={tab} />
      </div>

      <div className="mt-6">
        {tab === "timeline" && <MatchTimeline events={match.events} />}
        {tab === "stats" && (
          <MatchStatsTable
            home={match.homeTeam}
            away={match.awayTeam}
            homeStats={homeStats}
            awayStats={awayStats}
          />
        )}
        {tab === "lineups" && homeTeam && awayTeam && (
          <MatchLineups
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            homeSquad={homeTeam.squad}
            awaySquad={awayTeam.squad}
            events={match.events}
          />
        )}
        {tab === "ai" && (
          <AiSummaryCard subjectType="MATCH" subjectId={match.id} />
        )}
      </div>

      <LiveScorePoller status={match.status} />
    </div>
  );
}
