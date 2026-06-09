import Link from "next/link";
import { computeStandings } from "@/server/services/standingsService";
import { FlagIcon } from "@/components/team/FlagIcon";

export default async function StandingsPage() {
  const groups = await computeStandings();

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Standings</h1>
        <p className="text-sm text-muted-foreground">
          Group tables. Top two from each group qualify for the Round of 32, plus the eight best third-placed teams.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {groups.map((g) => (
          <section
            key={g.code}
            className="overflow-hidden rounded-lg border border-border/60 bg-card"
          >
            <header className="border-b border-border/60 bg-card-muted/40 px-4 py-2">
              <h2 className="text-sm font-medium tracking-tight">Group {g.code}</h2>
            </header>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 text-left font-medium sm:px-3">Team</th>
                  <Th>P</Th>
                  <Th>W</Th>
                  <Th>D</Th>
                  <Th>L</Th>
                  <Th className="hidden sm:table-cell">GF</Th>
                  <Th className="hidden sm:table-cell">GA</Th>
                  <Th>GD</Th>
                  <Th className="text-foreground">Pts</Th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r, i) => (
                  <tr
                    key={r.teamId}
                    className="border-t border-border/40"
                  >
                    <td className="max-w-0 px-2 py-2 sm:px-3">
                      <Link
                        href={`/teams/${r.teamId}`}
                        className="flex items-center gap-2 hover:text-primary"
                      >
                        <span className="w-3 shrink-0 text-xs text-muted-foreground">{i + 1}</span>
                        <span aria-hidden className="shrink-0"><FlagIcon emoji={r.flagEmoji} /></span>
                        <span className="truncate sm:hidden">{r.teamId}</span>
                        <span className="hidden truncate sm:inline">{r.teamName}</span>
                      </Link>
                    </td>
                    <Td>{r.played}</Td>
                    <Td>{r.won}</Td>
                    <Td>{r.drawn}</Td>
                    <Td>{r.lost}</Td>
                    <Td className="hidden sm:table-cell">{r.goalsFor}</Td>
                    <Td className="hidden sm:table-cell">{r.goalsAgainst}</Td>
                    <Td>{r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}</Td>
                    <Td bold>{r.points}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-2 py-2 text-center font-medium ${className}`}>{children}</th>
  );
}

function Td({
  children,
  bold = false,
  className = "",
}: {
  children: React.ReactNode;
  bold?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`px-2 py-2 text-center font-mono text-xs tabular-nums ${
        bold ? "font-semibold text-foreground" : "text-muted-foreground"
      } ${className}`}
    >
      {children}
    </td>
  );
}
