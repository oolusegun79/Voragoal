"use client";

import { useEffect, useState } from "react";
import { Info, Sparkles } from "lucide-react";

type RemainingTime = {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function diff(target: Date): RemainingTime {
  const total = target.getTime() - Date.now();
  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const sec = Math.floor(total / 1000);
  return {
    total,
    days: Math.floor(sec / 86400),
    hours: Math.floor((sec % 86400) / 3600),
    minutes: Math.floor((sec % 3600) / 60),
    seconds: sec % 60,
  };
}

/**
 * Top-of-dashboard banner. Combines a "sample data while we wait" notice with
 * a live countdown to the next scheduled match. Once kickoff has happened
 * the banner self-removes — the dashboard then shows real tournament data.
 */
export function KickoffCountdown({
  firstKickoffIso,
  firstMatchLabel,
}: {
  firstKickoffIso: string | null;
  firstMatchLabel: string | null;
}) {
  // Hydration-safe initial state. We set `mounted` once on the client so we
  // can render time-dependent values without an SSR mismatch warning.
  const [mounted, setMounted] = useState(false);
  const [remaining, setRemaining] = useState<RemainingTime | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!firstKickoffIso) return;
    const target = new Date(firstKickoffIso);
    const tick = () => setRemaining(diff(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [firstKickoffIso]);

  if (!firstKickoffIso) return null;

  // Tournament already started — banner is no longer useful.
  if (mounted && remaining && remaining.total <= 0) return null;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <section
      aria-labelledby="kickoff-countdown-heading"
      className="overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
            <Sparkles className="size-3.5" aria-hidden />
            <span id="kickoff-countdown-heading">Tournament kick-off</span>
          </div>
          {firstMatchLabel ? (
            <p className="mt-1 text-lg font-semibold tracking-tight">
              {firstMatchLabel}
            </p>
          ) : null}
          <p className="mt-1 inline-flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3 shrink-0" aria-hidden />
            <span>
              Pre-tournament view — this is sample data. Real match events, scores, and AI
              summaries fill in once the tournament begins.
            </span>
          </p>
        </div>

        <div
          className="grid shrink-0 grid-cols-4 gap-2 text-center sm:gap-3"
          aria-live="polite"
          aria-atomic="true"
        >
          <TimeBox value={mounted && remaining ? remaining.days : null} label="Days" />
          <TimeBox value={mounted && remaining ? remaining.hours : null} label="Hours" pad={pad} />
          <TimeBox value={mounted && remaining ? remaining.minutes : null} label="Min" pad={pad} />
          <TimeBox value={mounted && remaining ? remaining.seconds : null} label="Sec" pad={pad} />
        </div>
      </div>
    </section>
  );
}

function TimeBox({
  value,
  label,
  pad,
}: {
  value: number | null;
  label: string;
  pad?: (n: number) => string;
}) {
  return (
    <div className="min-w-[3.25rem] rounded-md bg-background/60 px-3 py-2 sm:min-w-[4rem]">
      <div className="font-mono text-xl font-bold tabular-nums sm:text-2xl">
        {value === null ? "—" : pad ? pad(value) : value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
