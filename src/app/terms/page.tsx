import type { Metadata } from "next";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of Voragoal.",
};

const LAST_UPDATED = "8 June 2026";

export default function TermsPage() {
  return (
    <>
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-10">
          <h1 className="text-4xl font-semibold tracking-tight">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </header>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <p>
              These Terms govern your use of Voragoal (the &quot;Service&quot;), operated by FirstData
              Consulting LLC (&quot;Voragoal&quot;, &quot;we&quot;, &quot;us&quot;). By creating an account
              or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">1. What Voragoal is</h2>
            <p className="text-muted-foreground">
              Voragoal is an independent analytics platform for the 2026 FIFA World Cup. We provide
              schedules, team and player data, statistics, and AI-generated factual summaries.
            </p>
            <p className="mt-2 text-muted-foreground">
              <span className="text-foreground">Independence.</span> Voragoal is not affiliated with,
              endorsed by, or sponsored by FIFA, any national football association, or any participating
              team. All trademarks belong to their respective owners.
            </p>
            <p className="mt-2 text-muted-foreground">
              <span className="text-foreground">Not a betting or prediction service.</span> Voragoal does
              not provide betting odds, wagering recommendations, predictions on match outcomes, or any form
              of gambling product. Nothing in the Service constitutes financial or gambling advice.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">2. Eligibility</h2>
            <p className="text-muted-foreground">
              You must be at least 13 years old (16 in the European Union) to create an account. By signing
              up, you confirm you meet this requirement.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">3. Your account</h2>
            <p className="text-muted-foreground">
              You are responsible for keeping your login credentials confidential and for all activity that
              occurs under your account. Notify us at{" "}
              <a className="underline" href="mailto:support@voragoal.com">
                support@voragoal.com
              </a>{" "}
              if you suspect unauthorised access.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">4. Tournament Pass</h2>
            <ul className="ml-5 list-disc space-y-2 text-muted-foreground">
              <li>
                The Tournament Pass is a one-time purchase that unlocks AI insights, favourites, and saved
                matches for the duration of the 2026 FIFA World Cup (kick-off 11 June through the Final on
                19 July 2026).
              </li>
              <li>
                The Pass also unlocks the full knockout bracket once 5 or more teams have qualified to it.
                The bracket remains free to view in the lead-up to the tournament while it is still mostly
                placeholder slots.
              </li>
              <li>
                The Pass is not a subscription — it does not auto-renew, and you will not be charged again.
              </li>
              <li>
                Payments are processed by Stripe. By purchasing, you also agree to Stripe&apos;s terms.
              </li>
              <li>
                <span className="text-foreground">Refunds.</span> Because the Pass is a digital product
                delivered immediately, all sales are final. We will refund proven duplicate charges or
                charges made in error. Where local law grants you a statutory right of withdrawal (e.g. EU
                14-day cooling-off period), you may exercise it before the Pass has been used; once you
                view AI insights or favourite a team, the digital service has been performed.
              </li>
              <li>
                We may revoke a Pass without refund if it was obtained fraudulently or in violation of these
                Terms.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">5. Acceptable use</h2>
            <p className="text-muted-foreground">You agree not to:</p>
            <ul className="mt-2 ml-5 list-disc space-y-1 text-muted-foreground">
              <li>Scrape, crawl, or otherwise extract data from the Service in bulk.</li>
              <li>Use automated systems to access the Service without our prior written consent.</li>
              <li>Resell, redistribute, or sublicense access to the Service or your Pass.</li>
              <li>Reverse engineer, decompile, or attempt to bypass paywalls or rate limits.</li>
              <li>Use the Service to harass, defraud, or harm others.</li>
              <li>
                Use the Service in connection with any betting, wagering, or prediction-market activity.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">6. AI-generated content</h2>
            <p className="text-muted-foreground">
              AI summaries are produced by large language models from the tournament facts in our database.
              We design them to be factual and to avoid speculation, but they may contain errors or
              omissions. AI content is for informational purposes only and should not be relied upon for any
              wagering or financial decision.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">7. Intellectual property</h2>
            <p className="text-muted-foreground">
              The Service, including its design, code, and the AI summaries we generate, is owned by
              FirstData Consulting LLC and protected by copyright and other laws. Public tournament facts
              (scores, fixtures, statistics) are not owned by us. You may not copy, modify, or distribute
              non-factual portions of the Service without our written permission.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">8. Termination</h2>
            <p className="text-muted-foreground">
              You may delete your account at any time. We may suspend or terminate accounts that violate
              these Terms, with or without notice. On termination, your access to the Service and to any
              active Tournament Pass ends.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">9. Disclaimers</h2>
            <p className="text-muted-foreground">
              The Service is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of
              any kind, express or implied, including warranties of merchantability, fitness for a particular
              purpose, and non-infringement. We do not warrant that the Service will be uninterrupted,
              error-free, or that data shown is complete or accurate at any given moment.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">10. Limitation of liability</h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, FirstData Consulting LLC, its officers, employees, and
              affiliates will not be liable for any indirect, incidental, special, consequential, or
              punitive damages, or any loss of profits or revenues, arising from your use of or inability to
              use the Service. Our total liability for any claim related to the Service is limited to the
              amount you paid us in the 12 months preceding the claim, or USD $50, whichever is greater.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">11. Governing law</h2>
            <p className="text-muted-foreground">
              These Terms are governed by the laws of the United States and the State in which FirstData
              Consulting LLC is registered, without regard to conflict-of-law rules. Disputes that cannot be
              resolved informally will be brought in the state or federal courts located in that
              jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">12. Changes to these Terms</h2>
            <p className="text-muted-foreground">
              We may update these Terms occasionally. The &quot;Last updated&quot; date at the top reflects
              the most recent version. Material changes will be communicated by email or in-app notice
              before they take effect. Continued use after changes take effect constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">13. Contact</h2>
            <p className="text-muted-foreground">
              Questions? Email{" "}
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
