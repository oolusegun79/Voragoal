import type { EventType } from "@prisma/client";
import { TeamCrest } from "@/components/team/TeamCrest";

const EVENT_LABEL: Record<EventType, string> = {
  GOAL: "Goal",
  OWN_GOAL: "Own goal",
  PENALTY_GOAL: "Goal (penalty)",
  PENALTY_MISS: "Penalty missed",
  ASSIST: "Assist",
  YELLOW_CARD: "Yellow card",
  RED_CARD: "Red card",
  SUB_IN: "Substitution",
  SUB_OUT: "Substitution",
  VAR: "VAR",
  INJURY: "Injury",
};

const EVENT_ICON: Record<EventType, string> = {
  GOAL: "⚽",
  PENALTY_GOAL: "⚽",
  OWN_GOAL: "⚽",
  PENALTY_MISS: "🚫",
  ASSIST: "🅰️",
  YELLOW_CARD: "🟨",
  RED_CARD: "🟥",
  SUB_IN: "🔁",
  SUB_OUT: "🔁",
  VAR: "📺",
  INJURY: "🚑",
};

type EventRow = {
  id: string;
  minute: number;
  addedMinute: number | null;
  type: EventType;
  detail: string | null;
  team: { flagEmoji: string; shortName: string };
  player: { knownAs: string | null; fullName: string } | null;
  relatedPlayer: { knownAs: string | null; fullName: string } | null;
};

export function MatchTimeline({ events }: { events: EventRow[] }) {
  if (events.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground">
        No events recorded yet. Match events appear here as they happen.
      </p>
    );
  }
  return (
    <ol className="space-y-1.5">
      {events.map((e) => (
        <li
          key={e.id}
          className="grid grid-cols-[60px_1fr] items-start gap-3 rounded-md border border-border/40 bg-card/60 px-3 py-2.5 text-sm"
        >
          <span className="font-mono text-xs text-muted-foreground">
            {e.minute}
            {e.addedMinute ? `+${e.addedMinute}` : ""}'
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span aria-hidden>{EVENT_ICON[e.type]}</span>
            <TeamCrest flagEmoji={e.team.flagEmoji} shortName={e.team.shortName} size="sm" />
            <span className="text-muted-foreground">{EVENT_LABEL[e.type]}</span>
            {e.player ? (
              <span className="font-medium">{e.player.knownAs ?? e.player.fullName}</span>
            ) : null}
            {e.relatedPlayer ? (
              <span className="text-muted-foreground">
                ({e.relatedPlayer.knownAs ?? e.relatedPlayer.fullName})
              </span>
            ) : null}
            {e.detail ? (
              <span className="text-muted-foreground">— {e.detail}</span>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
