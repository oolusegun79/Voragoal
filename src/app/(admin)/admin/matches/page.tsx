import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { listMatches } from "@/server/services/matchService";
import { TeamCrest } from "@/components/team/TeamCrest";
import { LocalDayList } from "@/components/matches/LocalDayList";
import { LocalTime } from "@/components/LocalTime";

export default async function AdminMatchesPage() {
  const matches = await listMatches();

  const items = matches.map((m) => {
    const finished = m.status === "FINISHED";
    const live = m.status === "LIVE";
    return {
      id: m.id,
      iso: m.kickoffAt.toISOString(),
      row: (
        <Link
          href={`/admin/matches/${m.id}/events`}
          className="grid grid-cols-[1fr_auto_1fr_auto_auto] items-center gap-4 border-b border-border/40 px-4 py-3 transition last:border-b-0 hover:bg-card-muted"
        >
          <div className="flex items-center justify-end gap-2">
            <TeamCrest flagEmoji={m.homeTeam.flagEmoji} shortName={m.homeTeam.shortName} accentColor={m.homeTeam.accentColor} size="sm" />
          </div>
          <div className="min-w-[80px] text-center font-mono text-sm">
            {finished ? (
              `${m.homeScore} – ${m.awayScore}`
            ) : live ? (
              "LIVE"
            ) : (
              <LocalTime iso={m.kickoffAt.toISOString()} variant="time" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <TeamCrest flagEmoji={m.awayTeam.flagEmoji} shortName={m.awayTeam.shortName} accentColor={m.awayTeam.accentColor} size="sm" />
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs ${
            live ? "bg-error/20 text-error"
            : finished ? "bg-success/20 text-success"
            : "bg-card-muted text-muted-foreground"
          }`}>
            {m.status}
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      ),
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Matches</h1>
        <p className="text-sm text-muted-foreground">
          Click a match to manage its events, score, and status.
        </p>
      </header>

      <div className="mt-8">
        <LocalDayList items={items} />
      </div>
    </div>
  );
}
