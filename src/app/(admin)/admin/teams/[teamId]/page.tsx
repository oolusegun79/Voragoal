import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { prisma } from "@/server/db";
import { TeamForm } from "@/components/admin/TeamForm";
import { deleteTeamAction } from "../actions";

export default async function EditTeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) notFound();

  const matchCount = await prisma.match.count({
    where: { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] },
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link
        href="/admin/teams"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All teams
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        <span aria-hidden>{team.flagEmoji}</span> {team.name}
      </h1>

      <div className="mt-6 rounded-xl border border-border/60 bg-card p-6">
        <TeamForm existing={team} />
      </div>

      <div className="mt-6 rounded-xl border border-error/30 bg-card p-6">
        <h2 className="text-sm font-medium tracking-tight text-error">Danger zone</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Deleting a team also removes its squad. Disallowed while {matchCount} match(es) reference it.
        </p>
        <form action={deleteTeamAction} className="mt-3">
          <input type="hidden" name="id" value={team.id} />
          <button
            type="submit"
            disabled={matchCount > 0}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-error/40 bg-error/10 px-3 text-xs font-medium text-error transition hover:bg-error/15 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" /> Delete team
          </button>
        </form>
      </div>
    </div>
  );
}
