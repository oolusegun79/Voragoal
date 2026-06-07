type StatRow = {
  teamId: string;
  possession: number | null;
  shots: number | null;
  shotsOnTarget: number | null;
  corners: number | null;
  fouls: number | null;
  offsides: number | null;
  xG: number | null;
  passes: number | null;
  passAccuracy: number | null;
};

type Team = { id: string; shortName: string; flagEmoji: string; accentColor: string };

const ROWS: Array<{
  key: keyof StatRow;
  label: string;
  format?: (v: number) => string;
  preferHigher?: boolean;
}> = [
  { key: "possession",   label: "Possession",     format: (v) => `${Math.round(v * 100)}%`, preferHigher: true },
  { key: "shots",        label: "Shots",          preferHigher: true },
  { key: "shotsOnTarget",label: "Shots on target",preferHigher: true },
  { key: "xG",           label: "xG",             format: (v) => v.toFixed(2), preferHigher: true },
  { key: "corners",      label: "Corners",        preferHigher: true },
  { key: "passes",       label: "Passes",         preferHigher: true },
  { key: "passAccuracy", label: "Pass accuracy",  format: (v) => `${Math.round(v * 100)}%`, preferHigher: true },
  { key: "fouls",        label: "Fouls",          preferHigher: false },
  { key: "offsides",     label: "Offsides",       preferHigher: false },
];

export function MatchStatsTable({
  home,
  away,
  homeStats,
  awayStats,
}: {
  home: Team;
  away: Team;
  homeStats: StatRow | null;
  awayStats: StatRow | null;
}) {
  if (!homeStats && !awayStats) {
    return (
      <p className="rounded-xl border border-dashed border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground">
        Match statistics haven't been entered for this fixture yet.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/40">
      {ROWS.map((row) => {
        const h = (homeStats?.[row.key] ?? null) as number | null;
        const a = (awayStats?.[row.key] ?? null) as number | null;
        if (h == null && a == null) return null;
        return (
          <StatBar
            key={row.key}
            label={row.label}
            homeRaw={h ?? 0}
            awayRaw={a ?? 0}
            homeColor={home.accentColor}
            awayColor={away.accentColor}
            format={row.format ?? ((v: number) => v.toLocaleString())}
          />
        );
      })}
    </div>
  );
}

function StatBar({
  label,
  homeRaw,
  awayRaw,
  homeColor,
  awayColor,
  format,
}: {
  label: string;
  homeRaw: number;
  awayRaw: number;
  homeColor: string;
  awayColor: string;
  format: (v: number) => string;
}) {
  const sum = homeRaw + awayRaw;
  const homePct = sum > 0 ? (homeRaw / sum) * 100 : 50;
  const awayPct = 100 - homePct;
  return (
    <div className="px-5 py-3">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-mono tabular-nums">{format(homeRaw)}</span>
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">{format(awayRaw)}</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-card-muted">
        <div style={{ width: `${homePct}%`, background: homeColor }} />
        <div style={{ width: `${awayPct}%`, background: awayColor }} />
      </div>
    </div>
  );
}
