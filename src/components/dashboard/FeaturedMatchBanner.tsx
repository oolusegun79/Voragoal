"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { FlagIcon } from "@/components/team/FlagIcon";
import { LocalTime } from "@/components/LocalTime";

type Role = "live" | "imminent" | "just-finished" | "upcoming";

type Team = {
  id: string;
  shortName: string;
  flagEmoji: string;
};

export type FeaturedMatchBannerProps = {
  matchId: string;
  role: Role;
  matchNumber: number;
  groupCode: string | null;
  kickoffIso: string;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED";
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  venueName: string | null;
  venueCity: string | null;
};

function formatRemaining(targetMs: number, nowMs: number): string {
  const total = targetMs - nowMs;
  if (total <= 0) return "Kick-off";
  const sec = Math.floor(total / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function FeaturedMatchBanner(props: FeaturedMatchBannerProps) {
  const {
    matchId,
    role,
    matchNumber,
    groupCode,
    kickoffIso,
    status,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    venueName,
    venueCity,
  } = props;

  const [mounted, setMounted] = useState(false);
  const [nowMs, setNowMs] = useState<number>(Date.now());

  useEffect(() => {
    setMounted(true);
    if (role !== "imminent" && role !== "upcoming") return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [role]);

  const statusPill = (() => {
    if (status === "LIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-error/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-error">
          <span className="size-1.5 animate-pulse rounded-full bg-error" />
          LIVE
        </span>
      );
    }
    if (status === "FINISHED") {
      return (
        <span className="rounded-full bg-muted-foreground/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Full time
        </span>
      );
    }
    if (role === "imminent" && mounted) {
      const target = new Date(kickoffIso).getTime();
      return (
        <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-warning">
          Kick-off in {formatRemaining(target, nowMs)}
        </span>
      );
    }
    return (
      <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
        Up next
      </span>
    );
  })();

  const showScore = status === "LIVE" || status === "FINISHED";

  return (
    <Link
      href={`/matches/${matchId}`}
      className="group relative block overflow-hidden rounded-xl border border-primary/30 transition hover:border-primary/60"
    >
      {/* Layered brand backdrop, matches the dashboard's other hero banner */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url(/brand/og.jpeg)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-background/85 via-background/60 to-background/85"
      />

      <div className="relative z-10 flex flex-col items-center gap-3 px-5 py-5 sm:py-6">
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium uppercase tracking-wider">Match {matchNumber}</span>
          {groupCode ? (
            <>
              <span aria-hidden>·</span>
              <span>Group {groupCode}</span>
            </>
          ) : null}
          <span aria-hidden>·</span>
          {statusPill}
        </div>

        <div className="flex items-center justify-center gap-4 text-center sm:gap-6">
          <TeamSide team={homeTeam} align="right" />

          {showScore ? (
            <div className="flex items-baseline gap-2 sm:gap-3">
              <Score value={homeScore ?? 0} />
              <span className="text-2xl font-light text-muted-foreground sm:text-3xl">–</span>
              <Score value={awayScore ?? 0} />
            </div>
          ) : (
            <div className="font-mono text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
              <LocalTime iso={kickoffIso} variant="time" />
            </div>
          )}

          <TeamSide team={awayTeam} align="left" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
          {venueName ? <span>{venueName}</span> : null}
          {venueCity ? (
            <>
              <span aria-hidden>·</span>
              <span>{venueCity}</span>
            </>
          ) : null}
        </div>

        {role === "imminent" || role === "upcoming" ? (
          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Info className="mt-0.5 size-3 shrink-0" aria-hidden />
            <span>
              Pre-tournament view — this is sample data. Real match events fill in once kick-off
              happens.
            </span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function TeamSide({ team, align }: { team: Team; align: "left" | "right" }) {
  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 ${align === "right" ? "flex-row-reverse" : "flex-row"}`}
    >
      <span aria-hidden className="text-3xl sm:text-4xl">
        <FlagIcon emoji={team.flagEmoji} />
      </span>
      <span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {team.shortName}
      </span>
    </div>
  );
}

function Score({ value }: { value: number }) {
  return (
    <span className="font-mono text-4xl font-bold tabular-nums text-foreground sm:text-5xl">
      {value}
    </span>
  );
}
