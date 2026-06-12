"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FlagIcon } from "@/components/team/FlagIcon";
import { LocalTime } from "@/components/LocalTime";

// Schema cap for MatchEvent.addedMinute. Mirrors LiveMatchClock so we never
// display a runaway clock if the admin forgets to mark Half time.
const ADDED_MINUTE_CAP = 30;

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
  kickoffStartedAtIso: string | null;
  secondHalfStartedAtIso: string | null;
  addedMinutes1H: number | null;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  venueName: string | null;
  venueCity: string | null;
};

function liveMinute(
  status: string,
  kickoffStartedAtIso: string | null,
  secondHalfStartedAtIso: string | null,
  addedMinutes1H: number | null,
  nowMs: number,
): { minute: number; seconds: number; addedMinute: number | null } | null {
  if (status !== "LIVE" || !kickoffStartedAtIso) return null;
  if (secondHalfStartedAtIso) {
    const elapsed = Math.max(0, nowMs - new Date(secondHalfStartedAtIso).getTime());
    const totalSec = Math.floor(elapsed / 1000);
    const minutes = 45 + Math.floor(totalSec / 60);
    if (minutes > 90) {
      return { minute: 90, seconds: 0, addedMinute: Math.min(minutes - 90, ADDED_MINUTE_CAP) };
    }
    return { minute: minutes, seconds: totalSec % 60, addedMinute: null };
  }
  if (addedMinutes1H == null) {
    const elapsed = Math.max(0, nowMs - new Date(kickoffStartedAtIso).getTime());
    const totalSec = Math.floor(elapsed / 1000);
    const minutes = Math.floor(totalSec / 60);
    if (minutes > 45) {
      return { minute: 45, seconds: 0, addedMinute: Math.min(minutes - 45, ADDED_MINUTE_CAP) };
    }
    return { minute: minutes, seconds: totalSec % 60, addedMinute: null };
  }
  // HT — the "Half time" pill already conveys the state.
  return null;
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

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
    kickoffStartedAtIso,
    secondHalfStartedAtIso,
    addedMinutes1H,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    venueName,
    venueCity,
  } = props;

  const isHalfTime =
    status === "LIVE" &&
    kickoffStartedAtIso != null &&
    secondHalfStartedAtIso == null &&
    addedMinutes1H != null;

  const [mounted, setMounted] = useState(false);
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const needsTick = role === "imminent" || role === "upcoming" || status === "LIVE";
    if (!needsTick) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [role, status]);

  // While LIVE, pull fresh server data (status flip to FINISHED, new score,
  // new clock anchors) every 15s. Mirrors LiveScorePoller on the match page.
  useEffect(() => {
    if (status !== "LIVE") return;
    const id = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(id);
  }, [status, router]);

  const minuteInfo = liveMinute(
    status,
    kickoffStartedAtIso,
    secondHalfStartedAtIso,
    addedMinutes1H,
    nowMs,
  );

  const statusPill = (() => {
    if (status === "LIVE") {
      if (isHalfTime) {
        return (
          <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-warning">
            Half time
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-error/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-error">
          <span className="size-1.5 animate-pulse rounded-full bg-error" />
          <span>LIVE</span>
          {mounted && minuteInfo ? (
            <span className="font-mono tabular-nums">
              {minuteInfo.addedMinute
                ? `${minuteInfo.minute}+${minuteInfo.addedMinute}`
                : `${minuteInfo.minute}:${pad2(minuteInfo.seconds)}`}
              &apos;
            </span>
          ) : null}
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
