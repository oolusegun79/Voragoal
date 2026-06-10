"use client";

import { useEffect, useState } from "react";

const KICKOFF_ISO = "2026-06-11T20:00:00Z";

export function HeroCountdown() {
  const [mounted, setMounted] = useState(false);
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 1 });

  useEffect(() => {
    setMounted(true);
    const target = new Date(KICKOFF_ISO);
    const tick = () => {
      const total = target.getTime() - Date.now();
      if (total <= 0) {
        setRemaining({ total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const sec = Math.floor(total / 1000);
      setRemaining({
        total,
        days: Math.floor(sec / 86400),
        hours: Math.floor((sec % 86400) / 3600),
        minutes: Math.floor((sec % 3600) / 60),
        seconds: sec % 60,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (mounted && remaining.total <= 0) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 py-1.5 text-sm font-medium text-success">
        <span className="size-1.5 animate-pulse rounded-full bg-success" />
        Tournament is live — join now
      </div>
    );
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-primary/30 bg-card/70 px-4 py-2 backdrop-blur">
      <span className="text-xs uppercase tracking-wider text-primary">Kick-off in</span>
      <span className="font-mono text-sm font-semibold tabular-nums" aria-live="polite">
        {mounted ? (
          <>
            <span>{remaining.days}d </span>
            <span>{pad(remaining.hours)}h </span>
            <span>{pad(remaining.minutes)}m </span>
            <span className="text-accent">{pad(remaining.seconds)}s</span>
          </>
        ) : (
          <span className="text-muted-foreground">— d — h — m — s</span>
        )}
      </span>
    </div>
  );
}
