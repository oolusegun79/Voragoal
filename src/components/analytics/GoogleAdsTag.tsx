import Script from "next/script";

const GOOGLE_ADS_ID = "AW-18229902307";

/**
 * Google Ads global site tag (gtag.js). Loaded after-interactive so it never
 * blocks first paint. Once initialised, individual conversion events are
 * fired by PurchaseConversionTracker on the checkout success page.
 *
 * Consent Mode v2 defaults are set to `denied` synchronously before gtag.js
 * loads, so even in the brief window before Iubenda's consent state arrives
 * no ad/analytics cookies are set. Iubenda's CMP then fires
 * `gtag('consent', 'update', granted)` on user accept.
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
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');`}
      </Script>
    </>
  );
}
