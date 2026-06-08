import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, CalendarDays, Sparkles, Trophy } from "lucide-react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { Footer } from "@/components/layout/Footer";
import { auth } from "@/server/auth/config";

const features = [
  {
    icon: CalendarDays,
    title: "Live schedule",
    body: "Every fixture, kickoff time, and venue across all 12 host cities.",
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
    body: "Possession, shots, xG, top scorers — drill from tournament down to a single goal.",
  },
  {
    icon: Trophy,
    title: "Standings & bracket",
    body: "Live group tables and the full knockout bracket from R32 to the final.",
  },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <>
      <MarketingHeader />

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="bg-hero-glow">
          <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center sm:py-32">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-accent" />
              2026 FIFA World Cup · Canada · Mexico · USA
            </span>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
              Every goal. Every stat.{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Every story.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
              The 2026 World Cup — explained. Browse the schedule, drill into every team and player,
              and read AI-generated summaries grounded in the actual data.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Get started — free
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/matches"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border/80 bg-card/40 px-6 text-sm text-foreground transition hover:bg-card"
              >
                Browse the schedule
              </Link>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="mx-auto w-full max-w-7xl px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body, accent }) => (
              <div
                key={title}
                className="rounded-xl border border-border/60 bg-card p-6 transition hover:border-border"
              >
                <Icon
                  className={`size-6 ${accent ? "text-accent" : "text-primary"}`}
                  aria-hidden
                />
                <h3 className="mt-4 font-medium tracking-tight">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
