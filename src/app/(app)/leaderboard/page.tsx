import type { Metadata } from "next";
import Link from "next/link";
import { TopScorersChart } from "@/components/charts/TopScorersChart";
import { getTopAssists, getTopScorers } from "@/server/services/statsService";
import { FlagIcon } from "@/components/team/FlagIcon";
import type { LeaderboardRow } from "@/server/services/statsService";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Top scorers and top assists of the 2026 FIFA World Cup, updated live as matches finish.",
};

const ROW_LIMIT = 25;

export default async function LeaderboardPage() {
  const [scorers, assists] = await Promise.all([
    getTopScorers(ROW_LIMIT),
    getTopAssists(ROW_LIMIT),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          Top scorers and top assists across the 2026 World Cup, ranked by total contributions to date.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <LeaderboardColumn
          title="Top scorers"
          subtitle="Goals scored (includes penalties; excludes own goals)"
          data={scorers}
          metric="goals"
        />
        <LeaderboardColumn
          title="Top assists"
          subtitle="Goal-creating passes"
          data={assists}
          metric="assists"
        />
      </div>
    </div>
  );
}

function LeaderboardColumn({
  title,
  subtitle,
  data,
  metric,
}: {
  title: string;
  subtitle: string;
  data: LeaderboardRow[];
  metric: "goals" | "assists";
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border/60 bg-card">
      <header className="border-b border-border/60 bg-card-muted/40 px-4 py-3">
        <h2 className="text-sm font-medium tracking-tight">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </header>
      {data.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          {metric === "goals"
            ? "No goalscorers yet. Top scorers appear once matches finish."
            : "No assists recorded yet. Top assists appear once matches finish."}
        </div>
      ) : (
        <>
          <div className="p-4">
            <TopScorersChart data={data.slice(0, 10)} metric={metric} tall />
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="border-t border-border/60">
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Player</th>
                <th className="px-3 py-2 text-left font-medium">Team</th>
                <th className="px-3 py-2 text-right font-medium">
                  {metric === "goals" ? "G" : "A"}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={row.playerId} className="border-t border-border/40">
                  <td className="px-3 py-2 text-xs text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/players/${row.playerId}`}
                      className="hover:text-primary"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2">
                      <FlagIcon emoji={row.flagEmoji} />
                      <span className="text-muted-foreground">{row.shortName}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
