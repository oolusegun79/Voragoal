import Script from "next/script";

const WIDGET_ID = "6b42df44-2cc5-4406-b3aa-d71b46349ab7";

/**
 * Iubenda Consent Management Platform — unified embed.
 *
 * Loaded `afterInteractive` so Iubenda's chained scripts (core-en, ui-v2,
 * second_layer — ~225 kB combined) do not block DOMContentLoaded. Our
 * own consent gating handles the brief window before Iubenda's CMP is
 * ready: gtag has `gtag('consent', 'default', denied)` set inline, and
 * TikTok calls `ttq.holdConsent()` immediately on load, so no marketing
 * cookies are set until Iubenda updates consent.
 *
 * Widget config lives in Iubenda's dashboard (siteId
 * 6b42df44-2cc5-4406-b3aa-d71b46349ab7) — banner style, toggles, etc.
 * change there with no code changes required.
 *
 * Iubenda integrations enabled in the dashboard:
 *  - Prior blocking of third-party trackers
 *  - Google Consent Mode v2 (auto-fires consent update on accept)
 *  - GDPR + LGPD + Swiss FADP + US state laws (incl. CCPA "Do Not Sell")
 *  - GPC (Global Privacy Control) signal honoring
 *  - Permanent consent log (Consent Database)
 */
export function IubendaConsent() {
  return (
    <Script
      id="iubenda-consent"
      strategy="afterInteractive"
      src={`https://embeds.iubenda.com/widgets/${WIDGET_ID}.js`}
    />
  );
}
