import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, CalendarDays, Sparkles, Trophy } from "lucide-react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { Footer } from "@/components/layout/Footer";
import { HeroCountdown } from "@/components/marketing/HeroCountdown";
import { auth } from "@/server/auth/config";
import { prisma } from "@/server/db";

const features = [
  {
    icon: CalendarDays,
    title: "Live schedule",
    body: "Every fixture, kickoff time, and venue across all 12 host cities, in your local timezone.",
  },
  {
    icon: Sparkles,
    title: "AI insights",
    body: "Plain-English summaries of every match, team, and player — built on the data, never invented.",
    accent: true,
  },
  {
    icon: BarChart3,
    title: "Deep analytics",
    body: "Possession, shots, top scorers, goal difference — drill from tournament down to a single goal.",
  },
  {
    icon: Trophy,
    title: "Standings & bracket",
    body: "Live group tables and the full knockout bracket from Round of 32 to the Final.",
  },
];


const hosts = [
  { code: "CAN", name: "Canada", flag: "🇨🇦" },
  { code: "MEX", name: "Mexico", flag: "🇲🇽" },
  { code: "USA", name: "United States", flag: "🇺🇸" },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  // Player count is dynamic so the number stays accurate as the admin adds
  // confirmed squads. Other figures are tournament constants.
  const playerCount = await prisma.player.count().catch(() => 1248);
  const numbers = [
    { value: "104", label: "Matches" },
    { value: "48", label: "Teams" },
    { value: "12", label: "Host cities" },
    { value: playerCount.toLocaleString(), label: "Players" },
  ];

  return (
    <>
      <MarketingHeader />

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          {/* Layer 1 — brand hero image */}
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{ backgroundImage: "url(/brand/og.jpeg)" }}
          />
          {/* Layer 2 — gradient overlays for legibility + atmosphere */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-hero-glow"
          />

          <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center sm:py-32">
            <HeroCountdown />

            <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="size-1.5 rounded-full bg-accent" />
              2026 FIFA World Cup
              <span className="hidden text-foreground/60 sm:inline">
                {hosts.map((h) => h.flag).join(" ")} Canada · Mexico · USA
              </span>
            </span>

            <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
              Every goal. Every stat.{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Every story.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
              An independent, AI-powered analytics platform for the 2026 FIFA World Cup. Schedule,
              teams, players, stats — explained, not invented. No betting, no predictions, no
              FIFA branding.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Get started — free
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/matches"
                className="inline-flex h-12 items-center justify-center rounded-md border border-border/80 bg-card/40 px-6 text-sm text-foreground backdrop-blur transition hover:bg-card"
              >
                Browse the schedule
              </Link>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Free to browse. Unlock AI insights with the{" "}
              <Link href="/pricing" className="font-medium text-accent hover:underline">
                $4.99 Tournament Pass
              </Link>{" "}
              <span className="line-through opacity-60">$7.99</span>{" "}
              — pre-kick-off offer.
            </p>
          </div>
        </section>

        {/* By the numbers */}
        <section className="border-b border-border/40 bg-card/30">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-px overflow-hidden px-6 py-12 sm:grid-cols-4 sm:gap-0">
            {numbers.map((n) => (
              <div key={n.label} className="px-4 py-2 text-center">
                <p className="bg-gradient-to-br from-primary to-accent bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
                  {n.value}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {n.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Feature cards */}
        <section className="mx-auto w-full max-w-7xl px-6 py-20">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for football fans, not bookies
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Every feature is here to help you follow the tournament more deeply. Nothing here
              tries to sell you a wager.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body, accent }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary/40"
              >
                <div
                  aria-hidden
                  className={`absolute inset-x-0 -top-px h-px bg-gradient-to-r ${
                    accent ? "from-transparent via-accent to-transparent" : "from-transparent via-primary to-transparent"
                  } opacity-0 transition group-hover:opacity-100`}
                />
                <Icon
                  className={`size-7 ${accent ? "text-accent" : "text-primary"}`}
                  aria-hidden
                />
                <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Free to register */}
        <section className="border-y border-border/40 bg-card/20">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Free to register.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              No card, no commitment. Sign up in seconds and start exploring the tournament.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Create your free account
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto w-full max-w-5xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            The tournament starts soon.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Be ready with the schedule, the stats, and the stories — wherever you watch from.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Create your free account
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/faq"
              className="inline-flex h-12 items-center justify-center rounded-md border border-border/80 bg-card/40 px-6 text-sm text-foreground transition hover:bg-card"
            >
              Read the FAQ
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
