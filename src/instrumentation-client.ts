// Browser Sentry initialisation. Loaded by Next.js automatically when
// present. Same gracefully-degrading pattern as instrumentation.ts.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",
    // Replay can balloon storage; keep it off for v1.
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
