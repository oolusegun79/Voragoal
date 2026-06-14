import type { Metadata } from "next";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Voragoal collects, uses, and protects your personal information.",
};

const LAST_UPDATED = "13 June 2026";

export default function PrivacyPage() {
  return (
    <>
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-10">
          <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </header>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <p>
              Voragoal (&quot;we&quot;, &quot;us&quot;) is an independent analytics platform for the 2026 FIFA
              World Cup, operated by FirstData Consulting LLC. We are not affiliated with, endorsed by, or
              sponsored by FIFA. This policy explains what data we collect, how we use it, and the choices
              you have.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">1. Information we collect</h2>
            <ul className="ml-5 list-disc space-y-2 text-muted-foreground">
              <li>
                <span className="text-foreground">Account information.</span> When you sign up, we store
                your email address, display name, and a hashed password (we never see your raw password). If
                you sign in with Google, we receive your email, name, and profile picture URL from Google.
              </li>
              <li>
                <span className="text-foreground">Tournament Pass.</span> If you purchase the Tournament
                Pass, we store the Stripe Checkout session ID, payment status, and the timestamp of your
                purchase. We never receive or store your card number, CVC, or full billing address — those go
                directly to Stripe.
              </li>
              <li>
                <span className="text-foreground">Your activity.</span> Teams and players you favourite,
                matches you save, and your profile preferences.
              </li>
              <li>
                <span className="text-foreground">Standard server logs.</span> Vercel (our host)
                automatically records request metadata (IP, user agent, path, status code) for security and
                operational reasons. We do not use this data for advertising.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">2. Cookies and similar technologies</h2>
            <p className="text-muted-foreground">Voragoal uses two categories of cookies:</p>

            <p className="mt-3 text-foreground">Essential cookies</p>
            <p className="text-muted-foreground">Required for the site to function:</p>
            <ul className="mt-1 ml-5 list-disc space-y-1 text-muted-foreground">
              <li>A session cookie that keeps you signed in.</li>
              <li>A CSRF token cookie that protects sign-in and account actions.</li>
            </ul>

            <p className="mt-4 text-foreground">Marketing and measurement cookies</p>
            <p className="text-muted-foreground">
              Set by third parties when their scripts load on our pages. We use them to see whether our ad
              campaigns are bringing visitors to the site and producing Tournament Pass purchases:
            </p>
            <ul className="mt-1 ml-5 list-disc space-y-1 text-muted-foreground">
              <li>
                <span className="text-foreground">TikTok Pixel</span> — sets cookies on TikTok-owned domains
                to attribute purchases to TikTok ad campaigns.
              </li>
              <li>
                <span className="text-foreground">Google Ads tag (gtag.js)</span> — sets cookies on
                Google-owned domains to attribute purchases to Google Ads campaigns.
              </li>
            </ul>

            <p className="mt-3 text-muted-foreground">
              When you first visit Voragoal, a consent banner asks whether you accept the marketing
              cookies above. You can accept or reject each category independently, and change your mind
              anytime via the <span className="text-foreground">Cookie Settings</span> link in the
              footer. We honor Global Privacy Control (GPC) signals — if your browser sends one, we
              treat it as a Do-Not-Sell-or-Share opt-out for US state privacy laws. You can also block
              marketing cookies at the browser level, or via Google Ad Settings (
              <a className="underline" href="https://adssettings.google.com" target="_blank" rel="noreferrer">
                adssettings.google.com
              </a>
              ) and the ad personalisation controls inside the TikTok app. For the complete
              machine-readable inventory of every cookie set on this site, see our{" "}
              <a
                className="underline"
                href="https://www.iubenda.com/privacy-policy/10595823/cookie-policy"
                target="_blank"
                rel="noreferrer"
              >
                Cookie Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">3. How we use your data</h2>
            <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
              <li>To create and maintain your account and authenticate you.</li>
              <li>To process your Tournament Pass purchase and grant access.</li>
              <li>To personalise your dashboard, favourites, and saved matches.</li>
              <li>To send transactional emails (e.g. password reset, purchase receipt).</li>
              <li>To protect Voragoal and our users from fraud and abuse.</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              We do not sell your personal data. We share limited measurement events with TikTok and Google
              Ads — specifically, that a purchase happened and the Stripe session ID (used as an opaque
              deduplication key). We never share your email, name, password, or account contents with
              advertisers.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">4. Third parties we use</h2>
            <ul className="ml-5 list-disc space-y-2 text-muted-foreground">
              <li>
                <span className="text-foreground">Stripe</span> — payment processing. Subject to Stripe&apos;s
                privacy policy.
              </li>
              <li>
                <span className="text-foreground">Google</span> — used in two ways. (1) Optional sign-in
                (Google Sign-In) — we request only your email, name, and profile picture. (2) Google Ads
                conversion measurement (gtag.js) — sets cookies on Google-owned domains and receives
                anonymous purchase events (the fact of a purchase plus the Stripe session ID for
                deduplication) to attribute Tournament Pass sales to Google Ads campaigns. Subject to
                Google&apos;s privacy policy.
              </li>
              <li>
                <span className="text-foreground">TikTok</span> — TikTok Pixel for ad measurement. Sets
                cookies on TikTok-owned domains and receives anonymous purchase events (the fact of a
                purchase plus the Stripe session ID for deduplication) to attribute Tournament Pass sales to
                TikTok ad campaigns. Subject to TikTok&apos;s privacy policy.
              </li>
              <li>
                <span className="text-foreground">Perplexity</span> — generates AI match, team, and player
                summaries via the Perplexity Sonar API. We send only public tournament facts (scores,
                lineups, events) — never your email, name, or any personal information.
              </li>
              <li>
                <span className="text-foreground">Vercel</span> — hosting and serverless infrastructure.
              </li>
              <li>
                <span className="text-foreground">Supabase</span> — managed PostgreSQL database where your
                account data lives.
              </li>
              <li>
                <span className="text-foreground">Zoho Mail</span> — outbound email (e.g. password reset,
                receipts).
              </li>
              <li>
                <span className="text-foreground">Iubenda</span> — Consent Management Platform. Stores
                the consent records (which cookie categories you accepted, when, and from what IP) that
                GDPR requires us to retain for audit. Subject to Iubenda&apos;s privacy policy.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">5. Data retention</h2>
            <p className="text-muted-foreground">
              We keep your account data for as long as your account exists. If you delete your account, we
              remove your personal data within 30 days, except where we are required to keep records (e.g.
              tax records for purchases, typically 7 years). Anonymised purchase records may be retained for
              accounting purposes.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">6. Your rights</h2>
            <p className="text-muted-foreground">
              Depending on where you live (EU/UK GDPR, California CCPA, and others), you may have the right
              to:
            </p>
            <ul className="mt-2 ml-5 list-disc space-y-1 text-muted-foreground">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data.</li>
              <li>Delete your account and associated data.</li>
              <li>Export your data in a portable format.</li>
              <li>Withdraw consent and object to processing.</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              To exercise any of these rights, email{" "}
              <a className="underline" href="mailto:support@voragoal.com">
                support@voragoal.com
              </a>
              . We respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">7. Children</h2>
            <p className="text-muted-foreground">
              Voragoal is not directed to children under 13 (or under 16 in the EU). We do not knowingly
              collect personal data from children. If you believe a child has created an account, please
              contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">8. International transfers</h2>
            <p className="text-muted-foreground">
              Our hosting and database providers may process data in the United States and other countries.
              Where required, we rely on standard contractual clauses or equivalent safeguards.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">9. Changes to this policy</h2>
            <p className="text-muted-foreground">
              We may update this policy from time to time. The &quot;Last updated&quot; date at the top will
              change. Material changes will be communicated by email or in-app notice before they take
              effect.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">10. Contact</h2>
            <p className="text-muted-foreground">
              Questions or concerns? Email{" "}
              <a className="underline" href="mailto:support@voragoal.com">
                support@voragoal.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
