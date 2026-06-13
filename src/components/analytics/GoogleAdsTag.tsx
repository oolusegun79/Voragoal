import Script from "next/script";

const GOOGLE_ADS_ID = "AW-18229902307";

/**
 * Google Ads global site tag (gtag.js). Loaded after-interactive so it never
 * blocks first paint. Once initialised, individual conversion events are
 * fired by PurchaseConversionTracker on the checkout success page.
 *
 * NOTE: this is a third-party tracker that sets cookies for ad attribution.
 * The current dismissible CookieNotice is not GDPR-grade consent. If we
 * start serving EU/UK visitors we should gate this (and the TikTok pixel)
 * behind a real consent flow with Google Consent Mode v2 defaults set to
 * denied until the user accepts.
 */
export function GoogleAdsTag() {
  return (
    <>
      <Script
        id="google-ads-loader"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
      />
      <Script id="google-ads-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');`}
      </Script>
    </>
  );
}
