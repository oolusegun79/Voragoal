"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  recomputeMatchScore,
  setMatchStatus,
  eventInputSchema,
} from "@/server/services/eventsService";
import { syncMatchFromFeed } from "@/server/services/feedImportService";

const STATUSES = ["SCHEDULED", "LIVE", "FINISHED", "POSTPONED", "CANCELLED"] as const;

type ActionState = { error?: string; ok?: true };

function bumpPaths(matchId: string) {
  revalidatePath(`/admin/matches/${matchId}/events`);
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/matches");
  revalidatePath("/dashboard");
  revalidatePath("/standings");
}

export async function createEventAction(
  _prev: ActionState,
  fd: FormData
): Promise<ActionState> {
  await requireRole("EDITOR");
  const parsed = eventInputSchema.safeParse({
    matchId: fd.get("matchId"),
    minute: fd.get("minute"),
    addedMinute: fd.get("addedMinute") || null,
    type: fd.get("type"),
    teamId: fd.get("teamId"),
    playerId: fd.get("playerId") || null,
    relatedPlayerId: fd.get("relatedPlayerId") || null,
    detail: fd.get("detail") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await createEvent(parsed.data);
  bumpPaths(parsed.data.matchId);
  return { ok: true };
}

export async function updateEventAction(
  _prev: ActionState,
  fd: FormData
): Promise<ActionState> {
  await requireRole("EDITOR");
  const id = String(fd.get("eventId"));
  const parsed = eventInputSchema.safeParse({
    matchId: fd.get("matchId"),
    minute: fd.get("minute"),
    addedMinute: fd.get("addedMinute") || null,
    type: fd.get("type"),
    teamId: fd.get("teamId"),
    playerId: fd.get("playerId") || null,
    relatedPlayerId: fd.get("relatedPlayerId") || null,
    detail: fd.get("detail") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await updateEvent(id, parsed.data);
  bumpPaths(parsed.data.matchId);
  return { ok: true };
}

export async function deleteEventAction(formData: FormData) {
  await requireRole("EDITOR");
  const id = String(formData.get("eventId"));
  const matchId = String(formData.get("matchId"));
  await deleteEvent(id);
  bumpPaths(matchId);
}

export async function recomputeScoreAction(formData: FormData) {
  await requireRole("EDITOR");
  const matchId = String(formData.get("matchId"));
  await recomputeMatchScore(matchId);
  bumpPaths(matchId);
}

export async function setStatusAction(formData: FormData) {
  await requireRole("EDITOR");
  const matchId = String(formData.get("matchId"));
  const status = String(formData.get("status"));
  if (!(STATUSES as readonly string[]).includes(status)) return;
  await setMatchStatus(matchId, status as (typeof STATUSES)[number]);
  bumpPaths(matchId);
}

export async function setExternalApiIdAction(formData: FormData) {
  await requireRole("EDITOR");
  const matchId = String(formData.get("matchId"));
  const raw = String(formData.get("externalApiId") ?? "").trim();
  await prisma.match.update({
    where: { id: matchId },
    data: { externalApiId: raw || null },
  });
  bumpPaths(matchId);
}

export async function syncFeedNowAction(formData: FormData) {
  await requireRole("EDITOR");
  const matchId = String(formData.get("matchId"));
  await syncMatchFromFeed(matchId);
  bumpPaths(matchId);
}
