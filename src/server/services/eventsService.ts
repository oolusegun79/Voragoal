import type { EventType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db";
import { scheduleMatchSummary } from "@/server/ai/aiSummaryService";

export const eventInputSchema = z.object({
  matchId: z.string().min(1),
  minute: z.coerce.number().int().min(0).max(150),
  addedMinute: z.coerce.number().int().min(0).max(30).optional().nullable(),
  type: z.enum([
    "GOAL",
    "OWN_GOAL",
    "PENALTY_GOAL",
    "PENALTY_MISS",
    "ASSIST",
    "YELLOW_CARD",
    "RED_CARD",
    "SUB_IN",
    "SUB_OUT",
    "VAR",
    "INJURY",
  ]),
  teamId: z.string().min(1),
  playerId: z.string().optional().nullable(),
  relatedPlayerId: z.string().optional().nullable(),
  detail: z.string().max(200).optional().nullable(),
  externalEventKey: z.string().max(200).optional().nullable(),
  importedFromFeed: z.boolean().optional(),
});
export type EventInput = z.infer<typeof eventInputSchema>;

const SCORING_TYPES: EventType[] = ["GOAL", "PENALTY_GOAL", "OWN_GOAL"];

function normalize(input: EventInput): EventInput {
  return {
    ...input,
    addedMinute: input.addedMinute || null,
    playerId: input.playerId || null,
    relatedPlayerId: input.relatedPlayerId || null,
    detail: input.detail?.trim() || null,
    externalEventKey: input.externalEventKey?.trim() || null,
    importedFromFeed: input.importedFromFeed ?? false,
  };
}

export async function createEvent(raw: EventInput) {
  const data = normalize(eventInputSchema.parse(raw));
  const event = await prisma.matchEvent.create({ data });
  if (SCORING_TYPES.includes(event.type)) {
    await recomputeMatchScore(event.matchId);
  }
  return event;
}

export async function updateEvent(id: string, raw: EventInput) {
  const data = normalize(eventInputSchema.parse(raw));
  const existing = await prisma.matchEvent.findUnique({ where: { id }, select: { matchId: true } });
  if (!existing) throw new Error("Event not found");
  const event = await prisma.matchEvent.update({ where: { id }, data });
  await recomputeMatchScore(existing.matchId);
  return event;
}

export async function deleteEvent(id: string) {
  const existing = await prisma.matchEvent.findUnique({ where: { id }, select: { matchId: true, type: true } });
  if (!existing) return;
  await prisma.matchEvent.delete({ where: { id } });
  if (SCORING_TYPES.includes(existing.type)) {
    await recomputeMatchScore(existing.matchId);
  }
}

/**
 * Re-derive Match.homeScore and Match.awayScore from MatchEvent rows.
 * Own-goals count for the *opposing* team.
 */
export async function recomputeMatchScore(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, homeTeamId: true, awayTeamId: true },
  });
  if (!match) return;

  const events = await prisma.matchEvent.findMany({
    where: { matchId, type: { in: SCORING_TYPES } },
    select: { type: true, teamId: true },
  });

  let homeScore = 0;
  let awayScore = 0;
  for (const e of events) {
    const credited = e.type === "OWN_GOAL"
      ? (e.teamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId)
      : e.teamId;
    if (credited === match.homeTeamId) homeScore += 1;
    else if (credited === match.awayTeamId) awayScore += 1;
  }

  await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore },
  });
  return { homeScore, awayScore };
}

export async function setMatchStatus(
  matchId: string,
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED"
) {
  return prisma.match.update({
    where: { id: matchId },
    data: { status },
  });
}

// ---- Live transitions ----

export async function startMatch(matchId: string) {
  return prisma.match.update({
    where: { id: matchId },
    data: {
      status: "LIVE",
      kickoffStartedAt: new Date(),
      // reset 2H markers in case of replay
      secondHalfStartedAt: null,
      addedMinutes1H: null,
      addedMinutes2H: null,
    },
  });
}

export async function recordHalfTime(matchId: string, addedMinutes1H?: number) {
  const m = await prisma.match.update({
    where: { id: matchId },
    data: { addedMinutes1H: addedMinutes1H ?? 0 },
  });
  scheduleMatchSummary(matchId);
  return m;
}

export async function resumeSecondHalf(matchId: string) {
  return prisma.match.update({
    where: { id: matchId },
    data: { secondHalfStartedAt: new Date() },
  });
}

export async function fullTime(matchId: string, addedMinutes2H?: number) {
  await recomputeMatchScore(matchId);
  const m = await prisma.match.update({
    where: { id: matchId },
    data: {
      status: "FINISHED",
      addedMinutes2H: addedMinutes2H ?? 0,
    },
  });
  scheduleMatchSummary(matchId);
  return m;
}

/**
 * Compute live clock from server-recorded timestamps.
 * Returns { half: 1|2|"HT"|null, minute, addedMinute|null }.
 */
export function computeClock(match: {
  status: string;
  kickoffStartedAt: Date | null;
  secondHalfStartedAt: Date | null;
  addedMinutes1H: number | null;
  addedMinutes2H: number | null;
}): { half: 1 | 2 | "HT" | null; minute: number; addedMinute: number | null } | null {
  if (match.status !== "LIVE" || !match.kickoffStartedAt) return null;
  const now = Date.now();

  // 2nd half running
  if (match.secondHalfStartedAt) {
    const elapsedMs = now - match.secondHalfStartedAt.getTime();
    const minutes = 45 + Math.floor(elapsedMs / 60000);
    const addedMinute = minutes > 90 ? minutes - 90 : null;
    return { half: 2, minute: addedMinute ? 90 : minutes, addedMinute };
  }

  // 1st half running (no HT recorded yet)
  if (match.addedMinutes1H == null) {
    const elapsedMs = now - match.kickoffStartedAt.getTime();
    const minutes = Math.floor(elapsedMs / 60000);
    const addedMinute = minutes > 45 ? minutes - 45 : null;
    return { half: 1, minute: addedMinute ? 45 : minutes, addedMinute };
  }

  // HT recorded, 2H not yet resumed → halftime
  return { half: "HT", minute: 45, addedMinute: match.addedMinutes1H };
}

export type EventCount = {
  goals: number;
  assists: number;
  yellows: number;
  reds: number;
  subs: number;
};

export function summarizeEventsForPlayer(
  events: { type: EventType; playerId: string | null; relatedPlayerId: string | null }[],
  playerId: string
): EventCount {
  let goals = 0, assists = 0, yellows = 0, reds = 0, subs = 0;
  for (const e of events) {
    if (e.playerId === playerId) {
      if (e.type === "GOAL" || e.type === "PENALTY_GOAL") goals += 1;
      else if (e.type === "YELLOW_CARD") yellows += 1;
      else if (e.type === "RED_CARD") reds += 1;
      else if (e.type === "SUB_IN" || e.type === "SUB_OUT") subs += 1;
    }
    if (
      e.relatedPlayerId === playerId &&
      (e.type === "GOAL" || e.type === "PENALTY_GOAL")
    ) {
      assists += 1;
    }
  }
  return { goals, assists, yellows, reds, subs };
}
