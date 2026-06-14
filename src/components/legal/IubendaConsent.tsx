import Script from "next/script";

const WIDGET_ID = "6b42df44-2cc5-4406-b3aa-d71b46349ab7";

/**
 * Iubenda Consent Management Platform — unified embed.
 *
 * Loaded `beforeInteractive` so the autoblocking + Google Consent Mode v2
 * defaults are in place before our TikTok pixel and Google Ads gtag.js
 * scripts try to set cookies. The widget is configured in Iubenda's
 * dashboard (siteId 6b42df44-2cc5-4406-b3aa-d71b46349ab7); to change
 * frameworks, banner style, or per-purpose toggles, edit it there — no
 * code change required, the CDN'd script picks it up automatically.
 *
 * Iubenda integrations enabled in the dashboard:
 *  - Prior blocking of third-party trackers
 *  - Google Consent Mode v2 (auto-sets `gtag('consent', 'default', denied)`
 *    and updates to `granted` on accept)
 *  - GDPR + LGPD + Swiss FADP + US state laws (incl. CCPA "Do Not Sell")
 *  - GPC (Global Privacy Control) signal honoring
 *  - Permanent consent log (Consent Database)
 */
export function IubendaConsent() {
  return (
    <Script
      id="iubenda-consent"
      strategy="beforeInteractive"
      src={`https://embeds.iubenda.com/widgets/${WIDGET_ID}.js`}
    />
  );
}
