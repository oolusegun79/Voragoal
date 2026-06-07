import { NextResponse } from "next/server";
import { requireApiRole, isAuthError } from "@/server/auth/api-guards";
import { startMatch } from "@/server/services/eventsService";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ matchId: string }> }
) {
  const auth = await requireApiRole("EDITOR");
  if (isAuthError(auth)) return auth;
  const { matchId } = await ctx.params;
  const match = await startMatch(matchId);
  return NextResponse.json({ match });
}
