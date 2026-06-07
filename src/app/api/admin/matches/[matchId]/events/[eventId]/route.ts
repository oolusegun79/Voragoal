import { NextResponse } from "next/server";
import { requireApiRole, isAuthError } from "@/server/auth/api-guards";
import { deleteEvent } from "@/server/services/eventsService";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ matchId: string; eventId: string }> }
) {
  const auth = await requireApiRole("EDITOR");
  if (isAuthError(auth)) return auth;

  const { eventId } = await ctx.params;
  await deleteEvent(eventId);
  return NextResponse.json({ ok: true });
}
