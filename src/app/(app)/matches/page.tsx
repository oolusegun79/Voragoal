import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { listMatches, type MatchFilters } from "@/server/services/matchService";
import { listTeams } from "@/server/services/teamService";
import { TeamCrest } from "@/components/team/TeamCrest";
import { LocalDayList } from "@/components/matches/LocalDayList";
import { LocalTime } from "@/components/LocalTime";
import type { MatchStage, MatchStatus } from "@prisma/client";

const STAGES: MatchStage[] = ["GROUP", "R32", "R16", "QF", "SF", "THIRD_PLACE", "FINAL"];
const STATUSES: MatchStatus[] = ["SCHEDULED", "LIVE", "FINISHED", "POSTPONED", "CANCELLED"];
const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

function parseFilters(sp: Record<string, string | string[] | undefined>): MatchFilters {
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const date = get("date");
  return {
    date: date ? new Date(date + "T00:00:00Z") : undefined,
    group: get("group") || undefined,
    teamId: get("team") || undefined,
    stage: (STAGES.includes(get("stage") as MatchStage) ? (get("stage") as MatchStage) : undefined),
    status: (STATUSES.includes(get("status") as MatchStatus) ? (get("status") as MatchStatus) : undefined),
  };
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const [matches, teams] = await Promise.all([listMatches(filters), listTeams()]);

  const dayItems = matches.map((m) => {
    const finished = m.status === "FINISHED";
    const live = m.status === "LIVE";
    return {
      id: m.id,
      iso: m.kickoffAt.toISOString(),
      row: (
        <Link
          href={`/matches/${m.id}`}
          className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 border-b border-border/40 px-4 py-3 transition last:border-b-0 hover:bg-card-muted sm:gap-6"
        >
          <div className="flex items-center justify-end gap-2">
            <TeamCrest
              flagEmoji={m.homeTeam.flagEmoji}
              shortName={m.homeTeam.shortName}
              accentColor={m.homeTeam.accentColor}
              size="md"
            />
          </div>
          <div className="min-w-[80px] text-center">
            {finished ? (
              <span className="font-mono text-base font-semibold tabular-nums">
                {m.homeScore} – {m.awayScore}
              </span>
            ) : live ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-error/20 px-2 py-0.5 text-xs font-medium text-error">
                <span className="size-1.5 animate-pulse rounded-full bg-error" />
                LIVE
              </span>
            ) : (
              <span className="font-mono text-sm text-muted-foreground">
                <LocalTime iso={m.kickoffAt.toISOString()} variant="time" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <TeamCrest
              flagEmoji={m.awayTeam.flagEmoji}
              shortName={m.awayTeam.shortName}
              accentColor={m.awayTeam.accentColor}
              size="md"
            />
          </div>
          <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
            <span>
              {m.stage === "GROUP" && m.groupCode
                ? `Group ${m.groupCode}`
                : m.stage.replaceAll("_", " ")}
            </span>
            {m.venue ? <span>· {m.venue.name}</span> : null}
            <ChevronRight className="size-4" />
          </div>
        </Link>
      ),
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Matches</h1>
        <p className="text-sm text-muted-foreground">
          All 2026 FIFA World Cup fixtures. Filter by group, team, stage, or status.
        </p>
      </header>

      {/* Filters bar — uses GET form so URL stays the source of truth */}
      <form
        method="get"
        className="mt-6 grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-card/60 p-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        <Filter label="Date" name="date" type="date" defaultValue={sp.date as string | undefined} />
        <Select label="Group" name="group" defaultValue={sp.group as string | undefined} options={[
          { value: "", label: "All" },
          ...GROUPS.map((g) => ({ value: g, label: `Group ${g}` })),
        ]} />
        <Select label="Team" name="team" defaultValue={sp.team as string | undefined} options={[
          { value: "", label: "All" },
          ...teams.map((t) => ({ value: t.id, label: `${t.flagEmoji} ${t.shortName}` })),
        ]} />
        <Select label="Stage" name="stage" defaultValue={sp.stage as string | undefined} options={[
          { value: "", label: "All" },
          ...STAGES.map((s) => ({ value: s, label: s.replaceAll("_", " ") })),
        ]} />
        <Select label="Status" name="status" defaultValue={sp.status as string | undefined} options={[
          { value: "", label: "All" },
          ...STATUSES.map((s) => ({ value: s, label: s })),
        ]} />
        <div className="col-span-full flex justify-end gap-2 lg:col-span-1 lg:col-start-5">
          <Link
            href="/matches"
            className="inline-flex h-9 items-center justify-center rounded-md border border-border/80 bg-background px-4 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </Link>
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Apply
          </button>
        </div>
      </form>

      {/* Results */}
      <div className="mt-8">
        <LocalDayList
          items={dayItems}
          empty={
            <p className="rounded-lg border border-border/60 bg-card/60 p-8 text-center text-sm text-muted-foreground">
              No matches found with these filters.
            </p>
          }
        />
      </div>
    </div>
  );
}

function Filter({
  label,
  name,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="mt-1 block h-9 w-full rounded-md border border-border/80 bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="mt-1 block h-9 w-full rounded-md border border-border/80 bg-background px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
