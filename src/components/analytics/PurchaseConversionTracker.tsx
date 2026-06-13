"use client";

import { useEffect } from "react";
import { trackGoogleAdsConversion } from "@/lib/gtag";

const CONVERSION_SEND_TO = "AW-18229902307/hB89CO3Ywb4cEOP32PRD";

/**
 * Fires the Google Ads "Tournament Pass purchase" conversion exactly once
 * per successful checkout. The success page is `dynamic = "force-dynamic"`,
 * so a user refreshing it would re-render us — sessionStorage keyed by the
 * Stripe session ID prevents a double-fire. Passing `transaction_id` lets
 * Google Ads de-duplicate independently on its side too.
 *
 * Per-conversion value is configured on the Google Ads conversion action
 * itself (4.99 USD, fixed), so we deliberately do not pass `value`/`currency`
 * here — if pricing ever becomes dynamic, switch the conversion action to
 * "Use different values" and add them to the event.
 */
export function PurchaseConversionTracker({
  sessionId,
}: {
  sessionId: string;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `gads:conv:${sessionId}`;
    if (window.sessionStorage.getItem(key)) return;
    trackGoogleAdsConversion(CONVERSION_SEND_TO, {
      transaction_id: sessionId,
    });
    window.sessionStorage.setItem(key, "1");
  }, [sessionId]);

  return null;
}
