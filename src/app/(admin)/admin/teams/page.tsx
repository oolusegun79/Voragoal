import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/server/db";

export default async function AdminTeamsPage() {
  const teams = await prisma.team.findMany({
    orderBy: [{ groupCode: "asc" }, { name: "asc" }],
    include: { _count: { select: { squad: true, homeMatches: true, awayMatches: true } } },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Teams</h1>
          <p className="text-sm text-muted-foreground">{teams.length} teams.</p>
        </div>
        <Link
          href="/admin/teams/new"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="size-4" /> New team
        </Link>
      </header>

      <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border/60 bg-card-muted/40">
              <th className="px-4 py-2 text-left font-medium">Team</th>
              <th className="px-4 py-2 text-center font-medium">Group</th>
              <th className="px-4 py-2 text-right font-medium">FIFA</th>
              <th className="px-4 py-2 text-right font-medium">Squad</th>
              <th className="px-4 py-2 text-right font-medium">Matches</th>
              <th className="px-4 py-2 text-right font-medium">Coach</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id} className="border-t border-border/40">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span aria-hidden>{t.flagEmoji}</span>
                    <span className="font-medium">{t.name}</span>
                    <span className="text-xs text-muted-foreground">{t.id}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-center text-xs">{t.groupCode ?? "—"}</td>
                <td className="px-4 py-2 text-right font-mono text-xs">{t.fifaRanking ?? "—"}</td>
                <td className="px-4 py-2 text-right font-mono text-xs">{t._count.squad}</td>
                <td className="px-4 py-2 text-right font-mono text-xs">
                  {t._count.homeMatches + t._count.awayMatches}
                </td>
                <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                  {t.manager ?? "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/admin/teams/${t.id}`}
                    className="inline-flex size-7 items-center justify-center rounded text-muted-foreground transition hover:bg-card-muted hover:text-foreground"
                    aria-label={`Edit ${t.name}`}
                  >
                    <Pencil className="size-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
