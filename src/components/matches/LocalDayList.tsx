"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";

/**
 * Groups arbitrary pre-rendered rows into day sections using the visitor's
 * local timezone. The server-rendered HTML buckets in UTC (so SSR is stable);
 * after hydration, the buckets and labels switch to the browser's timezone.
 *
 * Each item supplies the bucket key (its kickoff ISO timestamp) and the
 * already-rendered <Link>/row JSX — that way callers retain control over the
 * row markup (admin and public lists render slightly different rows).
 */
type Entry = { id: string; iso: string; row: ReactNode };

export function LocalDayList({
  items,
  empty,
}: {
  items: Entry[];
  empty?: ReactNode;
}) {
  const [tz, setTz] = useState<string | undefined>("UTC");
  useEffect(() => setTz(undefined), []);

  if (items.length === 0) return <>{empty ?? null}</>;

  const keyFmt = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: tz,
  });
  const labelFmt = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: tz,
  });

  const groups: Array<{ key: string; label: string; entries: Entry[] }> = [];
  for (const entry of items) {
    const date = new Date(entry.iso);
    const k = keyFmt.format(date);
    const last = groups[groups.length - 1];
    if (last && last.key === k) {
      last.entries.push(entry);
    } else {
      groups.push({ key: k, label: labelFmt.format(date).toUpperCase(), entries: [entry] });
    }
  }

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <section key={g.key}>
          <h2
            className="mb-3 text-xs uppercase tracking-wider text-muted-foreground"
            suppressHydrationWarning
          >
            {g.label}
          </h2>
          <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
            {g.entries.map((entry) => (
              <Fragment key={entry.id}>{entry.row}</Fragment>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
