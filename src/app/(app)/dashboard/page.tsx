import { CalendarDays, Goal, Sparkles, Target } from "lucide-react";
import { requireUser } from "@/server/auth/guards";
import {
  getFeaturedMatch,
  getGoalsByTeam,
  getResultsSplit,
  getTopScorers,
  getTournamentKpis,
  getUpcomingMatches,
} from "@/server/services/statsService";
import { favoriteTeamsWithNext } from "@/server/services/favoritesService";
import { KpiCard } from "@/components/charts/KpiCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { GoalsByTeamChart } from "@/components/charts/GoalsByTeamChart";
import { TopScorersChart } from "@/components/charts/TopScorersChart";
import { ResultsDonut } from "@/components/charts/ResultsDonut";
import { FavoritesRail } from "@/components/dashboard/FavoritesRail";
import { UpcomingMatchesTable } from "@/components/dashboard/UpcomingMatchesTable";
import { FeaturedMatchBanner } from "@/components/dashboard/FeaturedMatchBanner";

export default async function DashboardPage() {
  const user = await requireUser();
  const [kpis, goalsByTeam, topScorers, results, upcoming, faves, featured] = await Promise.all([
    getTournamentKpis(),
    getGoalsByTeam(10),
    getTopScorers(10),
    getResultsSplit(),
    getUpcomingMatches(5),
    favoriteTeamsWithNext(user.id),
    getFeaturedMatch(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <header>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {user.name ?? user.email}
        </h1>
      </header>

      {featured ? (
        <FeaturedMatchBanner
          matchId={featured.match.id}
          role={featured.role}
          matchNumber={featured.match.matchNumber}
          groupCode={featured.match.groupCode}
          kickoffIso={featured.match.kickoffAt.toISOString()}
          status={featured.match.status}
          kickoffStartedAtIso={featured.match.kickoffStartedAt?.toISOString() ?? null}
          secondHalfStartedAtIso={featured.match.secondHalfStartedAt?.toISOString() ?? null}
          addedMinutes1H={featured.match.addedMinutes1H}
          homeTeam={{
            id: featured.match.homeTeam.id,
            shortName: featured.match.homeTeam.shortName,
            flagEmoji: featured.match.homeTeam.flagEmoji,
          }}
          awayTeam={{
            id: featured.match.awayTeam.id,
            shortName: featured.match.awayTeam.shortName,
            flagEmoji: featured.match.awayTeam.flagEmoji,
          }}
          homeScore={featured.match.homeScore}
          awayScore={featured.match.awayScore}
          venueName={featured.match.venue?.name ?? null}
          venueCity={featured.match.venue?.city ?? null}
        />
      ) : null}

      {/* Row 1: KPI cards */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total matches"
          value={kpis.totalMatches}
          sublabel={`${kpis.finishedMatches} finished`}
          icon={CalendarDays}
          accent="primary"
        />
        <KpiCard
          label="Total goals"
          value={kpis.totalGoals}
          icon={Goal}
          accent="success"
        />
        <KpiCard
          label="Top scorer"
          value={kpis.topScorer ? kpis.topScorer.goals : "—"}
          sublabel={
            kpis.topScorer
              ? `${kpis.topScorer.player.knownAs ?? kpis.topScorer.player.fullName} · ${kpis.topScorer.player.team.shortName}`
              : "No goals yet"
          }
          icon={Target}
          accent="accent"
        />
        <KpiCard
          label="Upcoming · 7d"
          value={kpis.upcomingThisWeek}
          icon={Sparkles}
          accent="warning"
        />
      </section>

      {/* Row 2: bar chart + donut */}
      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <ChartCard title="Goals by team" description="Top 10 by goals scored.">
          <GoalsByTeamChart data={goalsByTeam} />
        </ChartCard>
        <ChartCard title="Results split" description="Decisive vs draws (finished matches).">
          <ResultsDonut data={results} />
        </ChartCard>
      </section>

      {/* Row 3: top scorers */}
      <section>
        <ChartCard title="Top scorers" description="Top 10 by goals across the tournament.">
          <TopScorersChart data={topScorers} />
        </ChartCard>
      </section>

      {/* Row 4: favorites rail */}
      <section>
        <FavoritesRail rows={faves} />
      </section>

      {/* Row 5: next up */}
      <section>
        <UpcomingMatchesTable matches={upcoming} />
      </section>
    </div>
  );
}
