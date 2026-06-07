import { NextResponse } from "next/server";
import { requireApiRole, isAuthError } from "@/server/auth/api-guards";
import { fullTime } from "@/server/services/eventsService";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ matchId: string }> }
) {
  const auth = await requireApiRole("EDITOR");
  if (isAuthError(auth)) return auth;
  const { matchId } = await ctx.params;
  let added: number | undefined;
  try {
    const body = (await req.json()) as { addedMinutes?: number };
    if (typeof body.addedMinutes === "number") added = body.addedMinutes;
  } catch {
    /* no body */
  }
  const match = await fullTime(matchId, added);
  return NextResponse.json({ match });
}
