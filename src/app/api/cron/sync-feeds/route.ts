import { NextResponse } from "next/server";
import {
  autoTransitionMatches,
  syncAllLiveMatches,
} from "@/server/services/feedImportService";
import { autoStartScheduledMatches } from "@/server/services/eventsService";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // 1. Matches with a feed: drive every state transition (kickoff, HT,
    //    resume 2H, FT) from API-Football's actual fixture state.
    const autoTransition = await autoTransitionMatches();
    // 2. Matches without a feed: fall back to kickoff-only auto-start so
    //    the timer at least begins on time even without API binding.
    const autoStart = await autoStartScheduledMatches();
    // 3. Pull new events for any match that's now LIVE.
    const feeds = await syncAllLiveMatches();
    return NextResponse.json({ autoTransition, autoStart, feeds });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "sync failed" },
      { status: 500 },
    );
  }
}
