import type { NextConfig } from "next";

// Content Security Policy. Pragmatic, not strict: Next.js + Tailwind v4 both
// inject inline scripts/styles for hydration data and CSS variables, so
// 'unsafe-inline' is unavoidable without a nonce middleware. We tighten
// everything else — default-src, base-uri, object-src, frame-ancestors,
// upgrade-insecure-requests — to limit the blast radius of any XSS.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.vercel-insights.com https://*.vercel.live wss://*.vercel.live",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
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

export default nextConfig;
