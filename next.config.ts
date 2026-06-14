import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Content Security Policy. Pragmatic, not strict: Next.js + Tailwind v4 both
// inject inline scripts/styles for hydration data and CSS variables, so
// 'unsafe-inline' is unavoidable without a nonce middleware. We tighten
// everything else — default-src, base-uri, object-src, frame-ancestors,
// upgrade-insecure-requests — to limit the blast radius of any XSS.
//
// Allowed third-party origins (kept narrow on purpose — each one is a
// known vendor we've vetted in the privacy policy):
//   - *.iubenda.com           Consent Management Platform (banner, autoblocking, hosted policies)
//   - *.googletagmanager.com  Google Ads gtag.js loader
//   - *.google.com, *.googleadservices.com, *.g.doubleclick.net
//                              Google Ads conversion tracking + measurement pings
//   - analytics.tiktok.com    TikTok Pixel + tracking calls
//   - *.sentry.io, *.ingest.us.sentry.io
//                              Sentry error/perf reporting
//   - *.vercel-*.com, *.vercel.live
//                              Vercel platform (preview banner, insights)
//   - js.stripe.com, *.stripe.com
//                              Stripe Checkout (frames + form action)
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-scripts.com https://*.iubenda.com https://*.googletagmanager.com https://*.google.com https://*.googleadservices.com https://analytics.tiktok.com",
  "style-src 'self' 'unsafe-inline' https://*.iubenda.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.vercel-insights.com https://*.vercel.live wss://*.vercel.live https://*.iubenda.com https://*.ingest.us.sentry.io https://*.sentry.io https://*.google.com https://*.googleadservices.com https://*.googletagmanager.com https://*.g.doubleclick.net https://analytics.tiktok.com https://*.tiktok.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://*.iubenda.com https://td.doubleclick.net",
  "form-action 'self' https://checkout.stripe.com https://accounts.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy",  value: csp },
  { key: "X-Content-Type-Options",   value: "nosniff" },
  { key: "X-Frame-Options",          value: "DENY" },
  { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",       value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // HSTS — only meaningful in production over HTTPS, but harmless in dev.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

// Wrap the Next.js config with Sentry's webpack plugin. When SENTRY_AUTH_TOKEN
// is missing (local dev, preview deploys), the plugin skips source map upload
// silently. When it's present (production), source maps are uploaded so
// stack traces in the Sentry dashboard show readable source instead of
// minified bundles.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
  // Only run the upload step when we have an auth token; otherwise the
  // plugin is a no-op wrapper.
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
