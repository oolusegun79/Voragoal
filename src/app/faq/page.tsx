import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about Voragoal — the Tournament Pass, AI insights, accounts, and refunds.",
};

type QA = { q: string; a: React.ReactNode };
type Section = { heading: string; items: QA[] };

const SECTIONS: Section[] = [
  {
    heading: "About Voragoal",
    items: [
      {
        q: "What is Voragoal?",
        a: (
          <>
            Voragoal is an independent analytics platform built specifically for the 2026 FIFA World
            Cup. We give you the schedule, group standings, knockout bracket, team and player
            profiles, match-by-match stats, and AI-generated summaries — all in a clean, fast,
            dark-mode interface.
          </>
        ),
      },
      {
        q: "Is Voragoal affiliated with FIFA?",
        a: (
          <>
            No. Voragoal is an independent platform operated by FirstData Consulting LLC. We are not
            affiliated with, endorsed by, or sponsored by FIFA, any national football association,
            or any participating team.
          </>
        ),
      },
      {
        q: "Does Voragoal offer betting, odds, or predictions?",
        a: (
          <>
            No, and we never will. Voragoal is a factual analytics platform. We do not provide
            betting odds, wagering recommendations, or predictions on match outcomes. Our AI
            summaries are explicitly designed to avoid speculation about future results.
          </>
        ),
      },
    ],
  },
  {
    heading: "Tournament Pass & billing",
    items: [
      {
        q: "What does the Tournament Pass include?",
        a: (
          <>
            The $4.99 Tournament Pass unlocks: AI match summaries (pre-match, half-time, full-time),
            AI team and player insights, the ability to favourite teams and players for a
            personalised dashboard, and saving matches to watch later. The schedule, standings,
            group tables, and knockout bracket are free for everyone.
          </>
        ),
      },
      {
        q: "Is the Pass a subscription?",
        a: (
          <>
            No — it is a single $4.99 one-time payment. There is no auto-renewal. The Pass covers
            the entire 2026 World Cup from kick-off on 11 June 2026 through the Final on 19 July
            2026.
          </>
        ),
      },
      {
        q: "Why is the price $4.99 instead of $7.99?",
        a: (
          <>
            $4.99 is our pre-kick-off offer for users who sign up before 11 June 2026. After the
            tournament begins, the price returns to $7.99.
          </>
        ),
      },
      {
        q: "Can I get a refund?",
        a: (
          <>
            Because the Pass is a digital product that unlocks AI features immediately on purchase,
            all sales are final. We will refund duplicate charges or charges made in error — email{" "}
            <a className="underline" href="mailto:support@voragoal.com">
              support@voragoal.com
            </a>{" "}
            within 7 days. EU customers have a statutory 14-day right of withdrawal that applies
            before any AI insight is viewed or favourite is created.
          </>
        ),
      },
      {
        q: "Will I see Voragoal on my card statement?",
        a: (
          <>
            Yes — the charge will appear as <span className="font-mono">VORAGOAL</span> or{" "}
            <span className="font-mono">VORAGOAL.COM</span> via Stripe. If you see something else,
            it is not us.
          </>
        ),
      },
      {
        q: "How are payments processed? Is my card safe?",
        a: (
          <>
            All payments are processed by Stripe, one of the largest and most trusted payment
            processors in the world. Voragoal never sees your card number, CVC, or full billing
            address — that information goes directly to Stripe.
          </>
        ),
      },
    ],
  },
  {
    heading: "Account & sign-in",
    items: [
      {
        q: "How do I create an account?",
        a: (
          <>
            Click <Link className="underline" href="/signup">Sign up</Link> on any page. You can sign
            up with an email and password or with your Google account. Both are free; the
            Tournament Pass is a separate one-time purchase.
          </>
        ),
      },
      {
        q: "Can I sign in with Google?",
        a: (
          <>
            Yes. The login page has a "Sign in with Google" button. If you already have an account
            with the same email, Google sign-in links to that account — you will not be charged
            twice for the Pass.
          </>
        ),
      },
      {
        q: "How do I reset my password?",
        a: (
          <>
            On the{" "}
            <Link className="underline" href="/login">
              login page
            </Link>
            , click <span className="font-medium">Forgot password?</span> Enter your email and we
            will send you a reset link that&apos;s valid for 1 hour. If you signed up with Google,
            you don&apos;t have a password — sign in with Google instead.
          </>
        ),
      },
      {
        q: "Can I delete my account?",
        a: (
          <>
            Yes. Email{" "}
            <a className="underline" href="mailto:support@voragoal.com">
              support@voragoal.com
            </a>{" "}
            from the address on the account and we will delete it within 30 days. See our{" "}
            <Link className="underline" href="/privacy">
              Privacy Policy
            </Link>{" "}
            for details on what we retain.
          </>
        ),
      },
    ],
  },
  {
    heading: "AI insights",
    items: [
      {
        q: "How are the AI summaries generated?",
        a: (
          <>
            Our AI summaries are produced by Anthropic's Claude model using only the tournament
            facts in our database — lineups, events, scores, and statistics. The model is
            instructed to be neutral, factual, and to never speculate about future results or use
            betting-related language.
          </>
        ),
      },
      {
        q: "Are the AI summaries always accurate?",
        a: (
          <>
            Summaries reflect the data we have, but data feeds can be late or incomplete during a
            live match. Treat AI summaries as analytical commentary, not as an official source of
            record. The official FIFA scoreboard is the authoritative source.
          </>
        ),
      },
      {
        q: "When do AI match summaries update?",
        a: (
          <>
            For live matches: a holding placeholder until half-time, then a 1H summary at half-time,
            then a full match summary at full-time. Team and player summaries refresh nightly. Pass
            holders can also manually regenerate any summary.
          </>
        ),
      },
    ],
  },
  {
    heading: "Privacy & data",
    items: [
      {
        q: "What data do you collect?",
        a: (
          <>
            Email, name, hashed password (or Google profile picture if you sign in with Google), and
            your in-app activity (favourites, saved matches). For purchases, we store the Stripe
            session ID and payment status. We never store card details. See our{" "}
            <Link className="underline" href="/privacy">
              Privacy Policy
            </Link>
            .
          </>
        ),
      },
      {
        q: "Do you use tracking or advertising cookies?",
        a: (
          <>
            No. Voragoal only uses strictly necessary cookies — the ones needed to keep you signed
            in and to protect against CSRF attacks. We do not use Google Analytics, Facebook Pixel,
            or any advertising tracker.
          </>
        ),
      },
      {
        q: "Is Voragoal available worldwide?",
        a: (
          <>
            Yes. You can sign up and use Voragoal from anywhere with a valid credit or debit card.
            Pricing is in USD.
          </>
        ),
      },
    ],
  },
  {
    heading: "Support",
    items: [
      {
        q: "How do I get help?",
        a: (
          <>
            Email{" "}
            <a className="underline" href="mailto:support@voragoal.com">
              support@voragoal.com
            </a>
            . We aim to respond within 24 hours during the tournament.
          </>
        ),
      },
      {
        q: "Where can I follow Voragoal on social media?",
        a: (
          <>
            We are on{" "}
            <a
              className="underline"
              href="https://www.youtube.com/channel/UCCZFfHWKXjvs7dHjA4apCHA"
              target="_blank"
              rel="noopener noreferrer"
            >
              YouTube
            </a>
            ,{" "}
            <a
              className="underline"
              href="https://www.tiktok.com/@voragoal"
              target="_blank"
              rel="noopener noreferrer"
            >
              TikTok
            </a>
            , and{" "}
            <a
              className="underline"
              href="https://x.com/voragoal"
              target="_blank"
              rel="noopener noreferrer"
            >
              X
            </a>
            . Links are in the footer of every page.
          </>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-10">
          <h1 className="text-4xl font-semibold tracking-tight">Frequently Asked Questions</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Quick answers about the Tournament Pass, AI insights, your account, and more. Can&apos;t
            find what you need? Email{" "}
            <a className="underline" href="mailto:support@voragoal.com">
              support@voragoal.com
            </a>
            .
          </p>
        </header>

        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-3 text-lg font-semibold tracking-tight text-accent">
                {section.heading}
              </h2>
              <div className="divide-y divide-border/40 rounded-xl border border-border/60 bg-card/40">
                {section.items.map((item) => (
                  <details key={item.q} className="group px-4 py-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-foreground">
                      <span>{item.q}</span>
                      <span
                        aria-hidden
                        className="shrink-0 text-muted-foreground transition group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
