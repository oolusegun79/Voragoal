import { NextResponse } from "next/server";
import { auth } from "@/server/auth/config";
import { getSummary } from "@/server/ai/aiSummaryService";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Sign in required" } },
      { status: 401 }
    );
  }
  const result = await getSummary("MATCH", matchId);
  return NextResponse.json(result);
}
