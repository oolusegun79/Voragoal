import Link from "next/link";
import { Star, Bookmark } from "lucide-react";
import { requireUser } from "@/server/auth/guards";
import {
  listFavoriteTeams,
  listFavoritePlayers,
  listSavedMatches,
} from "@/server/services/favoritesService";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { TeamCrest } from "@/components/team/TeamCrest";
import { formatKickoff } from "@/lib/formatters";

const TABS = ["account", "favorites", "saved"] as const;
type Tab = (typeof TABS)[number];

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const active: Tab = (TABS as readonly string[]).includes(sp.tab ?? "")
    ? (sp.tab as Tab)
    : "account";

  const [teams, players, matches] = await Promise.all([
    listFavoriteTeams(user.id),
    listFavoritePlayers(user.id),
    listSavedMatches(user.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">Your account, favorites, and saved matches.</p>
        </div>
        <LogoutButton />
      </header>

      {/* Tabs */}
      <nav className="mt-6 flex gap-1 border-b border-border/60">
        <TabLink href="/profile?tab=account"   label="Account"  active={active === "account"} />
        <TabLink href="/profile?tab=favorites" label={`Favorites (${teams.length + players.length})`} active={active === "favorites"} />
        <TabLink href="/profile?tab=saved"     label={`Saved (${matches.length})`} active={active === "saved"} />
      </nav>

      <div className="mt-6">
        {active === "account" && (
          <section className="space-y-3 rounded-xl border border-border/60 bg-card p-6">
            <Row label="Name"  value={user.name ?? "—"} />
            <Row label="Email" value={user.email ?? "—"} />
            <Row label="Role"  value={user.role} accent />
            <p className="pt-3 text-xs text-muted-foreground">
              Account editing (name, password) ships in Phase 8.
            </p>
          </section>
        )}

        {active === "favorites" && (
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Star className="size-4 text-warning" aria-hidden /> Teams
              </h2>
              {teams.length === 0 ? (
                <EmptyHint>
                  Star teams from any{" "}
                  <Link href="/teams" className="text-primary hover:underline">team page</Link>.
                </EmptyHint>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {teams.map((t) => (
                    <Link
                      key={t.id}
                      href={`/teams/${t.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 hover:border-border"
                      style={{ borderLeftColor: t.accentColor, borderLeftWidth: 3 }}
                    >
                      <span className="text-2xl" aria-hidden>{t.flagEmoji}</span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{t.shortName}</p>
                        <p className="truncate text-xs text-muted-foreground">{t.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Star className="size-4 text-warning" aria-hidden /> Players
              </h2>
              {players.length === 0 ? (
                <EmptyHint>
                  Star players from any team's squad list.
                </EmptyHint>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {players.map((p) => (
                    <Link
                      key={p.id}
                      href={`/players/${p.id}`}
                      className="rounded-lg border border-border/60 bg-card p-3 hover:border-border"
                    >
                      <p className="flex items-center gap-2">
                        {p.shirtNumber != null ? (
                          <span className="inline-flex size-6 items-center justify-center rounded bg-card-muted font-mono text-xs">
                            {p.shirtNumber}
                          </span>
                        ) : null}
                        <span className="truncate font-medium">{p.knownAs ?? p.fullName}</span>
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        <span aria-hidden>{p.team.flagEmoji}</span> {p.team.shortName}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {active === "saved" && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Bookmark className="size-4 text-warning" aria-hidden /> Saved matches
            </h2>
            {matches.length === 0 ? (
              <EmptyHint>
                Save matches from any{" "}
                <Link href="/matches" className="text-primary hover:underline">match detail page</Link>.
              </EmptyHint>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
                {matches.map((m) => (
                  <Link
                    key={m.id}
                    href={`/matches/${m.id}`}
                    className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-4 border-b border-border/40 px-4 py-3 transition last:border-b-0 hover:bg-card-muted"
                  >
                    <div className="flex items-center justify-end gap-2">
                      <TeamCrest flagEmoji={m.homeTeam.flagEmoji} shortName={m.homeTeam.shortName} accentColor={m.homeTeam.accentColor} size="sm" />
                    </div>
                    <span className="font-mono text-sm tabular-nums">
                      {m.status === "FINISHED" ? `${m.homeScore} – ${m.awayScore}` : "vs"}
                    </span>
                    <div className="flex items-center gap-2">
                      <TeamCrest flagEmoji={m.awayTeam.flagEmoji} shortName={m.awayTeam.shortName} accentColor={m.awayTeam.accentColor} size="sm" />
                    </div>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {formatKickoff(m.kickoffAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function TabLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`-mb-px border-b-2 px-4 py-2 text-sm transition ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "text-accent font-medium" : "font-medium"}>{value}</span>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
