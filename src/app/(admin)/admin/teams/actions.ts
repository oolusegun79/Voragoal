"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { teamSchema } from "@/lib/validations/admin";

type ActionState = { error?: string; ok?: true };

function bump() {
  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  revalidatePath("/dashboard");
  revalidatePath("/standings");
}

function readForm(fd: FormData) {
  return {
    id: fd.get("id") as string,
    name: fd.get("name") as string,
    shortName: fd.get("shortName") as string,
    flagEmoji: fd.get("flagEmoji") as string,
    accentColor: fd.get("accentColor") as string,
    groupCode: (fd.get("groupCode") as string) || null,
    fifaRanking: fd.get("fifaRanking") as string,
    manager: (fd.get("manager") as string) || null,
  };
}

export async function createTeamAction(
  _prev: ActionState,
  fd: FormData
): Promise<ActionState> {
  await requireRole("EDITOR");
  const parsed = teamSchema.safeParse(readForm(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const existing = await prisma.team.findUnique({ where: { id: parsed.data.id }, select: { id: true } });
  if (existing) return { error: `Team ID '${parsed.data.id}' already exists` };
  await prisma.team.create({ data: parsed.data });
  bump();
  redirect("/admin/teams");
}

export async function updateTeamAction(
  _prev: ActionState,
  fd: FormData
): Promise<ActionState> {
  await requireRole("EDITOR");
  const parsed = teamSchema.safeParse(readForm(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, ...rest } = parsed.data;
  await prisma.team.update({ where: { id }, data: rest });
  bump();
  return { ok: true };
}

export async function deleteTeamAction(fd: FormData) {
  await requireRole("EDITOR");
  const id = String(fd.get("id"));
  // Defensive: only delete if no matches reference this team.
  const refs = await prisma.match.count({
    where: { OR: [{ homeTeamId: id }, { awayTeamId: id }] },
  });
  if (refs > 0) {
    throw new Error(`Can't delete: ${refs} match(es) reference this team. Reassign matches first.`);
  }
  await prisma.team.delete({ where: { id } });
  bump();
  redirect("/admin/teams");
}
