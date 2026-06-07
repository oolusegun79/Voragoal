import Link from "next/link";

const TABS = [
  { key: "timeline", label: "Timeline" },
  { key: "stats",    label: "Stats" },
  { key: "lineups",  label: "Lineups" },
  { key: "ai",       label: "AI summary" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

export function MatchTabs({ matchId, active }: { matchId: string; active: TabKey }) {
  return (
    <nav className="flex gap-1 border-b border-border/60">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={`/matches/${matchId}?tab=${t.key}`}
          className={`-mb-px border-b-2 px-4 py-2 text-sm transition ${
            active === t.key
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
