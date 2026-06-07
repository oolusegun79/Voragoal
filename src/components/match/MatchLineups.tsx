import Link from "next/link";
import type { EventType, Player, Team } from "@prisma/client";
import { TeamCrest } from "@/components/team/TeamCrest";
import { summarizeEventsForPlayer } from "@/server/services/eventsService";

type EventRow = {
  type: EventType;
  playerId: string | null;
  relatedPlayerId: string | null;
};

export function MatchLineups({
  homeTeam,
  awayTeam,
  homeSquad,
  awaySquad,
  events,
}: {
  homeTeam: Team;
  awayTeam: Team;
  homeSquad: Player[];
  awaySquad: Player[];
  events: EventRow[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SquadColumn team={homeTeam} squad={homeSquad} events={events} />
      <SquadColumn team={awayTeam} squad={awaySquad} events={events} />
    </div>
  );
}

function SquadColumn({
  team,
  squad,
  events,
}: {
  team: Team;
  squad: Player[];
  events: EventRow[];
}) {
  if (squad.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6">
        <div className="mb-3">
          <TeamCrest flagEmoji={team.flagEmoji} shortName={team.shortName} accentColor={team.accentColor} size="md" />
        </div>
        <p className="text-sm text-muted-foreground">
          Squad data hasn't been entered for {team.name} yet.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <header
        className="border-b border-border/60 px-4 py-3"
        style={{ borderLeftColor: team.accentColor, borderLeftWidth: 3 }}
      >
        <TeamCrest flagEmoji={team.flagEmoji} shortName={team.shortName} accentColor={team.accentColor} size="md" />
      </header>
      <ul>
        {squad.map((p) => {
          const counts = summarizeEventsForPlayer(events, p.id);
          const appeared = counts.goals + counts.assists + counts.yellows + counts.reds + counts.subs > 0;
          return (
            <li key={p.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-border/40 px-4 py-2 text-sm first:border-t-0">
              <Link
                href={`/players/${p.id}`}
                className={`flex items-center gap-2 ${appeared ? "" : "text-muted-foreground"}`}
              >
                {p.shirtNumber != null ? (
                  <span className="inline-flex size-6 items-center justify-center rounded bg-card-muted font-mono text-xs">
                    {p.shirtNumber}
                  </span>
                ) : null}
                <span className="truncate">{p.knownAs ?? p.fullName}</span>
                <span className="text-xs text-muted-foreground">· {p.position}</span>
              </Link>
              <div className="flex items-center gap-1.5 text-xs">
                {counts.goals > 0 ? <Badge>⚽ {counts.goals}</Badge> : null}
                {counts.assists > 0 ? <Badge>🅰️ {counts.assists}</Badge> : null}
                {counts.yellows > 0 ? <Badge>🟨 {counts.yellows}</Badge> : null}
                {counts.reds > 0 ? <Badge>🟥 {counts.reds}</Badge> : null}
                {counts.subs > 0 ? <Badge>🔁</Badge> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-card-muted px-1.5 py-0.5 font-mono tabular-nums">
      {children}
    </span>
  );
}
