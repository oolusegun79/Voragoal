"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { playerSchema } from "@/lib/validations/admin";

type ActionState = { error?: string; ok?: true };

function bump(teamId?: string) {
  revalidatePath("/admin/players");
  if (teamId) revalidatePath(`/teams/${teamId}`);
  revalidatePath("/teams");
}

function readForm(fd: FormData) {
  return {
    fullName: fd.get("fullName") as string,
    knownAs: (fd.get("knownAs") as string) || null,
    teamId: fd.get("teamId") as string,
    position: fd.get("position") as string,
    shirtNumber: fd.get("shirtNumber") as string,
    club: (fd.get("club") as string) || null,
    heightCm: fd.get("heightCm") as string,
  };
}

export async function createPlayerAction(
  _prev: ActionState,
  fd: FormData
): Promise<ActionState> {
  await requireRole("EDITOR");
  const parsed = playerSchema.safeParse(readForm(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await prisma.player.create({ data: parsed.data });
  bump(parsed.data.teamId);
  redirect(`/admin/players?team=${parsed.data.teamId}`);
}

export async function updatePlayerAction(
  _prev: ActionState,
  fd: FormData
): Promise<ActionState> {
  await requireRole("EDITOR");
  const id = String(fd.get("id"));
  const parsed = playerSchema.safeParse(readForm(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await prisma.player.update({ where: { id }, data: parsed.data });
  bump(parsed.data.teamId);
  return { ok: true };
}

export async function deletePlayerAction(fd: FormData) {
  await requireRole("EDITOR");
  const id = String(fd.get("id"));
  const refs = await prisma.matchEvent.count({
    where: { OR: [{ playerId: id }, { relatedPlayerId: id }] },
  });
  if (refs > 0) {
    throw new Error(`Can't delete: this player is referenced by ${refs} match event(s).`);
  }
  const player = await prisma.player.findUnique({ where: { id }, select: { teamId: true } });
  await prisma.player.delete({ where: { id } });
  bump(player?.teamId);
  redirect(player?.teamId ? `/admin/players?team=${player.teamId}` : "/admin/players");
}
