"use client";

import { useEffect } from "react";
import { trackTikTok } from "@/lib/tiktok";

/**
 * Fires TikTok's CompletePayment event exactly once per successful checkout.
 * The success page is `dynamic = "force-dynamic"`, so a user refreshing it
 * would re-run the server logic and re-render us — sessionStorage keyed by
 * the Stripe session ID prevents a double-fire from breaking ROAS counts.
 *
 * Server-side Events API (if/when wired) would dedupe with the same event_id.
 */
export function CompletePaymentTracker({
  sessionId,
  value,
  currency = "USD",
}: {
  sessionId: string;
  value: number;
  currency?: string;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `tt:cp:${sessionId}`;
    if (window.sessionStorage.getItem(key)) return;
    trackTikTok(
      "CompletePayment",
      {
        value,
        currency,
        content_id: "tournament_pass",
        content_type: "product",
      },
      { event_id: sessionId },
    );
    window.sessionStorage.setItem(key, "1");
  }, [sessionId, value, currency]);

  return null;
}
