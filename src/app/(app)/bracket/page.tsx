import Link from "next/link";
import { computeBracket, type BracketCell, type ResolvedSlot } from "@/server/services/bracketService";
import { FlagIcon } from "@/components/team/FlagIcon";
import { LocalTime } from "@/components/LocalTime";

export const dynamic = "force-dynamic";

const HEADER_COLS: Array<{ col: number; label: string }> = [
  { col: 1, label: "Round of 32" },
  { col: 2, label: "Round of 16" },
  { col: 3, label: "Quarter-final" },
  { col: 4, label: "Semi-final" },
  { col: 5, label: "Final" },
  { col: 6, label: "Semi-final" },
  { col: 7, label: "Quarter-final" },
  { col: 8, label: "Round of 16" },
  { col: 9, label: "Round of 32" },
];

export default async function BracketPage() {
  const cells = await computeBracket();

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Bracket</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Knockout bracket from Round of 32 to the Final. Slots auto-fill as group standings
          finalise and knockout results come in.
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/40 p-4">
        <div
          className="grid min-w-[1400px] gap-x-3 gap-y-2"
          style={{
            gridTemplateColumns: "repeat(9, minmax(0, 1fr))",
            gridTemplateRows: "auto repeat(16, minmax(36px, auto))",
          }}
        >
          {HEADER_COLS.map((h) => (
            <div
              key={h.col}
              className="px-2 pb-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
              style={{ gridColumnStart: h.col, gridColumnEnd: h.col + 1, gridRowStart: 1, gridRowEnd: 2 }}
            >
              {h.label}
            </div>
          ))}

          {cells.map((cell) => (
            <Cell key={cell.matchNumber} cell={cell} />
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Group-position slots (e.g. <span className="font-mono">1E</span>,{" "}
        <span className="font-mono">2A</span>) resolve once all 6 matches in that group are
        finished. Best-third-placed slots (e.g. <span className="font-mono">3ABCDF</span>) are
        finalised by FIFA after the group stage and will be filled in once the matching
        Round-of-32 fixture is created in Admin.
      </p>
    </div>
  );
}

function Cell({ cell }: { cell: BracketCell }) {
  const finished = cell.status === "FINISHED";
  const live = cell.status === "LIVE";

  const inner = (
    <div
      className={`flex h-full flex-col justify-center rounded-md border bg-card p-2 transition ${
        cell.matchId ? "border-border/60 hover:border-border" : "border-dashed border-border/40"
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <span>M{cell.matchNumber}</span>
        <span className="whitespace-nowrap text-[8px] tracking-normal">
          <LocalTime iso={cell.kickoffAt.toISOString()} variant="date" /> · <LocalTime iso={cell.kickoffAt.toISOString()} variant="time" />
        </span>
      </div>
      <SlotRow slot={cell.home} score={cell.homeScore} penalties={cell.homePenalties} />
      <SlotRow slot={cell.away} score={cell.awayScore} penalties={cell.awayPenalties} />
      {cell.venue ? (
        <p className="mt-1 truncate text-[10px] text-muted-foreground">{cell.venue.city}</p>
      ) : null}
      {live ? (
        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-red-400">
          <span className="size-1.5 animate-pulse rounded-full bg-red-400" /> LIVE
        </div>
      ) : finished ? (
        <div className="mt-1 text-[10px] font-medium text-muted-foreground">FT</div>
      ) : null}
    </div>
  );

  const style = {
    gridColumnStart: cell.col,
    gridColumnEnd: cell.col + 1,
    gridRowStart: cell.rowStart + 1, // +1 because row 1 is the header row
    gridRowEnd: cell.rowEnd + 1,
  };

  if (cell.matchId) {
    return (
      <Link href={`/matches/${cell.matchId}`} style={style} className="block">
        {inner}
      </Link>
    );
  }

  return (
    <div style={style}>
      {inner}
    </div>
  );
}

function SlotRow({
  slot,
  score,
  penalties,
}: {
  slot: ResolvedSlot;
  score: number | null;
  penalties: number | null;
}) {
  if (slot.resolved) {
    return (
      <div className="flex items-center justify-between gap-2 py-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="text-sm" aria-hidden>
            <FlagIcon emoji={slot.team.flagEmoji} />
          </span>
          <span className="truncate text-xs font-medium">{slot.team.shortName}</span>
        </div>
        {score != null ? (
          <span className="font-mono text-xs tabular-nums">
            {score}
            {penalties != null ? (
              <span className="ml-0.5 text-[10px] text-muted-foreground">({penalties})</span>
            ) : null}
          </span>
        ) : null}
      </div>
    );
  }
  return (
    <div className="flex items-center py-0.5">
      <span className="font-mono text-xs text-muted-foreground">{slot.label}</span>
    </div>
  );
}
