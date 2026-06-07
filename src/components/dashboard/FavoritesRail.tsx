import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import type { favoriteTeamsWithNext } from "@/server/services/favoritesService";
import { FlagIcon } from "@/components/team/FlagIcon";
import { formatKickoff } from "@/lib/formatters";

type Row = Awaited<ReturnType<typeof favoriteTeamsWithNext>>[number];

export function FavoritesRail({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
        <Star className="mx-auto mb-2 size-5 text-warning" aria-hidden />
        Star teams from any{" "}
        <Link href="/teams" className="text-primary hover:underline">
          team page
        </Link>{" "}
        to track them here.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium tracking-tight">
          <Star className="mr-1 inline size-4 text-warning" /> Your favorites
        </h3>
        <Link href="/profile" className="text-xs text-muted-foreground hover:text-foreground">
          Manage
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {rows.map(({ team, nextMatch }) => (
          <Link
            key={team.id}
            href={`/teams/${team.id}`}
            className="group flex w-64 shrink-0 items-start gap-3 rounded-lg border border-border/60 bg-card-muted/40 p-3 transition hover:border-border"
            style={{ borderLeftColor: team.accentColor, borderLeftWidth: 3 }}
          >
            <span className="text-2xl" aria-hidden><FlagIcon emoji={team.flagEmoji} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{team.name}</p>
              {nextMatch ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Next: {nextMatch.homeTeamId === team.id ? "vs " : "@ "}
                  {nextMatch.homeTeamId === team.id ? nextMatch.awayTeam.shortName : nextMatch.homeTeam.shortName}
                  {" · "}
                  {formatKickoff(nextMatch.kickoffAt)}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">No upcoming match</p>
              )}
            </div>
            <ChevronRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
