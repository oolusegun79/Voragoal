// Server + edge Sentry initialisation. Next.js calls register() once per
// runtime at boot. When NEXT_PUBLIC_SENTRY_DSN is missing (local dev, CI,
// preview deploys without secrets), Sentry runs in a noop mode and ships
// nothing.
import * as Sentry from "@sentry/nextjs";

export function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      // Avoid logging events from local development.
      enabled: process.env.NODE_ENV === "production",
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
