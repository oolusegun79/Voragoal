import { NextResponse } from "next/server";
import { requireApiRole, isAuthError } from "@/server/auth/api-guards";
import { getSummary } from "@/server/ai/aiSummaryService";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ teamId: string }> }
) {
  const auth = await requireApiRole("EDITOR");
  if (isAuthError(auth)) return auth;
  const { teamId } = await ctx.params;
  const result = await getSummary("TEAM", teamId, { force: true });
  return NextResponse.json(result);
}
