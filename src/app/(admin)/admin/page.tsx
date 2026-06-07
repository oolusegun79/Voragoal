import Link from "next/link";
import { CalendarDays, Flag, Users, Trophy } from "lucide-react";
import { prisma } from "@/server/db";
import { KpiCard } from "@/components/charts/KpiCard";

export default async function AdminHome() {
  const [teams, players, matches, users, finished, scheduled] = await Promise.all([
    prisma.team.count(),
    prisma.player.count(),
    prisma.match.count(),
    prisma.user.count(),
    prisma.match.count({ where: { status: "FINISHED" } }),
    prisma.match.count({ where: { status: "SCHEDULED" } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Admin overview</h1>
        <p className="text-sm text-muted-foreground">
          Quick stats. Use the sidebar to manage matches and events.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Teams"   value={teams}   icon={Flag}         accent="primary" />
        <KpiCard label="Players" value={players} icon={Users}        accent="accent" />
        <KpiCard label="Matches" value={matches} icon={CalendarDays} accent="success"
          sublabel={`${finished} finished · ${scheduled} scheduled`} />
        <KpiCard label="Users"   value={users}   icon={Trophy}       accent="warning" />
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-6">
        <h2 className="text-sm font-medium tracking-tight">Get started</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a match and add events as they happen.
        </p>
        <Link
          href="/admin/matches"
          className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Manage matches →
        </Link>
      </section>
    </div>
  );
}
