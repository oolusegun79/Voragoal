"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RotateCcw, Goal } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[error.tsx]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Goal className="size-5 text-primary" aria-hidden />
            Voragoal
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16 text-center">
        <div className="max-w-md">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-error/15">
            <AlertTriangle className="size-7 text-error" aria-hidden />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We hit an unexpected error rendering that page. The team has been notified.
          </p>
          {error.digest ? (
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <RotateCcw className="size-4" /> Try again
            </button>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-md border border-border/80 bg-card/40 px-4 text-sm text-muted-foreground transition hover:text-foreground"
            >
              Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
