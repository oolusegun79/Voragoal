import Link from "next/link";
import { listTeams } from "@/server/services/teamService";
import { FlagIcon } from "@/components/team/FlagIcon";

export default async function TeamsPage() {
  const teams = await listTeams();
  const groups = new Map<string, typeof teams>();
  for (const t of teams) {
    const key = t.groupCode ?? "?";
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Teams</h1>
        <p className="text-sm text-muted-foreground">
          All 48 nations across 12 groups.
        </p>
      </header>

      <div className="mt-8 space-y-8">
        {[...groups.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([code, list]) => (
            <section key={code}>
              <h2 className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                Group {code}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {list.map((t) => (
                  <Link
                    key={t.id}
                    href={`/teams/${t.id}`}
                    className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card p-4 transition hover:border-border"
                    style={{ borderLeftColor: t.accentColor, borderLeftWidth: 3 }}
                  >
                    <span className="text-3xl" aria-hidden><FlagIcon emoji={t.flagEmoji} /></span>
                    <div className="min-w-0">
                      <p className="truncate font-medium tracking-tight">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.fifaRanking ? `FIFA #${t.fifaRanking}` : "—"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
