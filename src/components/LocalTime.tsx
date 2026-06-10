"use client";

import { useEffect, useState } from "react";

type Variant = "kickoff" | "date" | "time";

/**
 * Renders a date in the browser's local timezone and locale. Server-side it
 * renders the same value in UTC so the markup is stable for SEO and the
 * initial paint; useEffect then swaps to the visitor's timezone after
 * hydration. The wrapping <time> element gives the ISO string to screen
 * readers and search engines.
 */
export function LocalTime({
  iso,
  variant = "kickoff",
}: {
  iso: string;
  variant?: Variant;
}) {
  const [text, setText] = useState<string>(() => format(new Date(iso), variant, "UTC"));

  useEffect(() => {
    setText(format(new Date(iso), variant));
  }, [iso, variant]);

  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}

function format(date: Date, variant: Variant, timeZone?: string): string {
  const opts: Intl.DateTimeFormatOptions = timeZone ? { timeZone } : {};
  if (variant === "date") {
    Object.assign(opts, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } else if (variant === "time") {
    Object.assign(opts, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } else {
    Object.assign(opts, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    });
  }
  return new Intl.DateTimeFormat(undefined, opts).format(date);
}
