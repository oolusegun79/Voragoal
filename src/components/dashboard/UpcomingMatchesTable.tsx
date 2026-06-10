import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Match, Team, Venue } from "@prisma/client";
import { TeamCrest } from "@/components/team/TeamCrest";
import { LocalTime } from "@/components/LocalTime";

type UpcomingMatch = Match & {
  homeTeam: Team;
  awayTeam: Team;
  venue: Venue | null;
};

export function UpcomingMatchesTable({ matches }: { matches: UpcomingMatch[] }) {
  if (matches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
        No upcoming matches scheduled.
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-5 py-3">
        <h3 className="text-sm font-medium tracking-tight">Next up</h3>
        <p className="text-xs text-muted-foreground">The next {matches.length} scheduled matches.</p>
      </div>
      <div>
        {matches.map((m) => (
          <Link
            key={m.id}
            href={`/matches/${m.id}`}
            className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-4 border-b border-border/40 px-5 py-3 transition last:border-b-0 hover:bg-card-muted"
          >
            <div className="flex items-center justify-end gap-2">
              <TeamCrest flagEmoji={m.homeTeam.flagEmoji} shortName={m.homeTeam.shortName} accentColor={m.homeTeam.accentColor} size="sm" />
            </div>
            <span className="font-mono text-xs text-muted-foreground">vs</span>
            <div className="flex items-center gap-2">
              <TeamCrest flagEmoji={m.awayTeam.flagEmoji} shortName={m.awayTeam.shortName} accentColor={m.awayTeam.accentColor} size="sm" />
            </div>
            <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
              <span><LocalTime iso={m.kickoffAt.toISOString()} /></span>
              {m.venue ? <span>· {m.venue.name}</span> : null}
              <ChevronRight className="size-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
