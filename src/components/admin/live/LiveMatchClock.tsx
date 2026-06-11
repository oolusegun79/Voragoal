"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ClockState = {
  status: string;
  kickoffStartedAt: string | null;
  secondHalfStartedAt: string | null;
  addedMinutes1H: number | null;
};

// Schema-defined max for MatchEvent.addedMinute. The clock caps the
// computed added time at this value so events stay savable even when an
// admin forgets to mark Half time and the wall-clock has run for hours.
const ADDED_MINUTE_CAP = 30;

function compute(state: ClockState): { half: 1 | 2 | "HT" | "—"; minute: number; addedMinute: number | null } {
  if (state.status !== "LIVE" || !state.kickoffStartedAt) {
    return { half: "—", minute: 0, addedMinute: null };
  }
  const now = Date.now();

  if (state.secondHalfStartedAt) {
    const elapsed = now - new Date(state.secondHalfStartedAt).getTime();
    const minutes = 45 + Math.floor(elapsed / 60000);
    return minutes > 90
      ? { half: 2, minute: 90, addedMinute: Math.min(minutes - 90, ADDED_MINUTE_CAP) }
      : { half: 2, minute: minutes, addedMinute: null };
  }

  if (state.addedMinutes1H == null) {
    const elapsed = now - new Date(state.kickoffStartedAt).getTime();
    const minutes = Math.floor(elapsed / 60000);
    return minutes > 45
      ? { half: 1, minute: 45, addedMinute: Math.min(minutes - 45, ADDED_MINUTE_CAP) }
      : { half: 1, minute: minutes, addedMinute: null };
  }

  return { half: "HT", minute: 45, addedMinute: state.addedMinutes1H };
}

export function LiveMatchClock({ state }: { state: ClockState }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (state.status !== "LIVE") return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [state.status]);

  const c = compute(state);
  const isHT = c.half === "HT";
  const isLive = c.half === 1 || c.half === 2;

  return (
    <div className="inline-flex items-center gap-3 font-mono">
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium tracking-wide",
          isLive ? "bg-error/20 text-error" : isHT ? "bg-warning/20 text-warning" : "bg-card-muted text-muted-foreground"
        )}
      >
        {isHT ? "HALF TIME" : c.half === 1 ? "1H" : c.half === 2 ? "2H" : "—"}
      </span>
      <span className="text-2xl font-semibold tabular-nums">
        {c.minute}'{c.addedMinute ? `+${c.addedMinute}` : ""}
      </span>
      <span className="text-[10px] text-muted-foreground" aria-hidden>
        {/* tick reference; keeps the rerender ticking visually */}
        {tick % 2 === 0 ? "·" : " "}
      </span>
    </div>
  );
}

export function getCurrentMinute(state: ClockState): number {
  const c = compute(state);
  return c.minute;
}

export function getAddedMinute(state: ClockState): number | null {
  const c = compute(state);
  return c.addedMinute;
}
