import { Check, Sparkles } from "lucide-react";
import { auth } from "@/server/auth/config";
import { userHasPass } from "@/server/auth/access";
import { CheckoutButton } from "./CheckoutButton";

export const dynamic = "force-dynamic";

const INCLUDED = [
  "AI match summaries (powered by Claude) — pre-match, half-time, full-time",
  "AI team & player insights, updated as the tournament progresses",
  "Favourite teams & players — personalised dashboard",
  "Save matches to watch later",
  "Full schedule, standings, knockout bracket — free for everyone",
];

const NOT_INCLUDED = [
  "No betting, odds, or predictions — never has been, never will be",
  "No FIFA affiliation — independent analytics only",
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const session = await auth();
  const alreadyPaid = await userHasPass(session?.user?.id);
  const isWelcome = welcome === "1" && Boolean(session?.user) && !alreadyPaid;
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {isWelcome ? (
        <div className="mb-6 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          ✓ Welcome{firstName ? `, ${firstName}` : ""} — your free account is ready.
          Browse the schedule, teams, and standings anytime. Unlock AI insights and
          favourites with the pass below.
        </div>
      ) : null}

      <header className="text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-accent">
          Tournament Pass
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Every goal. Every stat. Every story.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Unlock AI insights and personalised favourites for the entire 2026 FIFA World Cup.
          One payment. No subscription. No auto-renewal.
        </p>
      </header>

      <section className="mt-10 rounded-2xl border border-border/60 bg-card p-8">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold tracking-tight">$4.99</span>
          <span className="text-sm text-muted-foreground">USD · one-time</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Full access from kick-off (11 June 2026) through the Final (19 July 2026).
        </p>

        <ul className="mt-6 space-y-3 text-sm">
          {INCLUDED.map((item) => (
            <li key={item} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-success" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <CheckoutButton
            authenticated={Boolean(session?.user)}
            alreadyPaid={alreadyPaid}
          />
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Payments processed securely by Stripe. We never see your card details.
        </p>

        {!alreadyPaid ? (
          <p className="mt-4 text-center text-xs">
            <a href="/dashboard" className="text-muted-foreground hover:text-foreground">
              Maybe later — continue with free access →
            </a>
          </p>
        ) : null}
      </section>

      <section className="mt-10 rounded-xl border border-border/40 bg-card/40 p-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-accent" /> What RealGoal is not
        </h2>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {NOT_INCLUDED.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
      </section>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Questions? Email{" "}
        <a className="underline" href="mailto:support@realgoal.app">
          support@realgoal.app
        </a>
        .
      </p>
    </div>
  );
}
