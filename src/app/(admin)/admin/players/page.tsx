import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/server/db";
import { FlagIcon } from "@/components/team/FlagIcon";

export default async function AdminPlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const sp = await searchParams;
  const teamFilter = sp.team;

  const [teams, players] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.player.findMany({
      where: teamFilter ? { teamId: teamFilter } : undefined,
      include: { team: true },
      orderBy: [{ team: { name: "asc" } }, { position: "asc" }, { shirtNumber: "asc" }],
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Players</h1>
          <p className="text-sm text-muted-foreground">
            {players.length} player{players.length === 1 ? "" : "s"}
            {teamFilter ? ` · filtered to one team` : " across all teams"}.
          </p>
        </div>
        <Link
          href={teamFilter ? `/admin/players/new?team=${teamFilter}` : "/admin/players/new"}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="size-4" /> New player
        </Link>
      </header>

      <form method="get" className="mt-6 flex items-end gap-3">
        <label className="block flex-1 max-w-xs">
          <span className="text-xs text-muted-foreground">Filter by team</span>
          <select
            name="team"
            defaultValue={teamFilter ?? ""}
            className="mt-1 block h-9 w-full rounded-md border border-border/80 bg-background px-3 text-sm"
          >
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.flagEmoji} {t.name}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-md bg-card-muted px-4 text-sm hover:bg-card"
        >
          Apply
        </button>
        {teamFilter ? (
          <Link
            href="/admin/players"
            className="inline-flex h-9 items-center text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border/60 bg-card-muted/40">
              <th className="px-4 py-2 text-left font-medium">Player</th>
              <th className="px-4 py-2 text-left font-medium">Team</th>
              <th className="px-4 py-2 text-center font-medium">Pos</th>
              <th className="px-4 py-2 text-center font-medium">#</th>
              <th className="px-4 py-2 text-left font-medium">Club</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No players. <Link href="/admin/players/new" className="text-primary hover:underline">Add one →</Link>
                </td>
              </tr>
            ) : (
              players.map((p) => (
                <tr key={p.id} className="border-t border-border/40">
                  <td className="px-4 py-2">
                    <div className="font-medium">{p.knownAs ?? p.fullName}</div>
                    {p.knownAs ? (
                      <div className="text-xs text-muted-foreground">{p.fullName}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-2">
                    <span aria-hidden><FlagIcon emoji={p.team.flagEmoji} /></span> {p.team.shortName}
                  </td>
                  <td className="px-4 py-2 text-center text-xs">{p.position}</td>
                  <td className="px-4 py-2 text-center font-mono text-xs">{p.shirtNumber ?? "—"}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{p.club ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/players/${p.id}`}
                      className="inline-flex size-7 items-center justify-center rounded text-muted-foreground transition hover:bg-card-muted hover:text-foreground"
                      aria-label={`Edit ${p.fullName}`}
                    >
                      <Pencil className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
