/**
 * Client-only TikTok Pixel tracking helper. Safe to call from any client
 * component — silently no-ops on the server, when ad blockers strip the
 * pixel script, or if the call itself throws. Analytics must never break
 * a user flow.
 */
type TtqParams = Record<string, unknown>;

declare global {
  interface Window {
    ttq?: {
      track: (event: string, params?: TtqParams, opts?: { event_id?: string }) => void;
      page?: () => void;
    };
  }
}

export function trackTikTok(
  event: string,
  params?: TtqParams,
  opts?: { event_id?: string },
) {
  if (typeof window === "undefined") return;
  if (!window.ttq) return;
  try {
    window.ttq.track(event, params, opts);
  } catch {
    // Swallow.
  }
}
