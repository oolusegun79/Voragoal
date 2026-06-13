/**
 * Client-only Google Ads (gtag.js) tracking helper. Safe to call from any
 * client component — silently no-ops on the server, when ad blockers strip
 * the gtag script, or if the call itself throws. Analytics must never break
 * a user flow.
 */
type GtagParams = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function trackGoogleAdsConversion(sendTo: string, params?: GtagParams) {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;
  try {
    window.gtag("event", "conversion", { send_to: sendTo, ...params });
  } catch {
    // Swallow.
  }
}
