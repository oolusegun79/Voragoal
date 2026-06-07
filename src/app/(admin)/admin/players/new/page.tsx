import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/server/db";
import { PlayerForm } from "@/components/admin/PlayerForm";

export default async function NewPlayerPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const sp = await searchParams;
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link
        href="/admin/players"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All players
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">New player</h1>

      <div className="mt-6 rounded-xl border border-border/60 bg-card p-6">
        <PlayerForm teams={teams} defaultTeamId={sp.team} />
      </div>
    </div>
  );
}
