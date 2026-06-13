import type { SubjectType } from "@prisma/client";
import { prisma } from "@/server/db";
import { MODELS, isAiConfigured, perplexityChat } from "@/server/ai/perplexity";
import { STYLE_GUIDE } from "@/server/ai/styleGuide";
import {
  buildMatchFacts,
  buildTeamFacts,
  buildPlayerFacts,
  canonicalJson,
  hashFacts,
} from "@/server/ai/factsSnapshot";

// Hard guardrail — these substrings must never appear in output.
const DENYLIST =
  /\b(bet|betting|odds|wager|wagering|gamble|gambling|parlay|moneyline|spread|over\/under|prediction market)\b/i;

export type SummaryResult = {
  contentMd: string;
  cached: boolean;
  modelId: string;
  generated: "ok" | "fallback" | "skipped_live" | "ai_unconfigured" | "empty_data";
};

async function buildFacts(subjectType: SubjectType, subjectId: string) {
  if (subjectType === "MATCH")  return buildMatchFacts(subjectId);
  if (subjectType === "TEAM")   return buildTeamFacts(subjectId);
  if (subjectType === "PLAYER") return buildPlayerFacts(subjectId);
  return null;
}

function fallbackTemplate(subjectType: SubjectType, facts: unknown): string {
  if (subjectType === "MATCH") {
    const m = facts as Awaited<ReturnType<typeof buildMatchFacts>>;
    if (!m) return "Match data unavailable.";
    if (m.status === "SCHEDULED") {
      return `${m.home.name} face ${m.away.name} in ${m.stage === "GROUP" ? `Group ${m.groupCode}` : m.stage.replaceAll("_", " ")}${
        m.venue ? ` at ${m.venue.name}` : ""
      }. Kickoff at ${new Date(m.kickoffAt).toUTCString()}.`;
    }
    return `${m.home.name} ${m.home.score ?? 0} – ${m.away.score ?? 0} ${m.away.name}. ${m.events.length} recorded event${m.events.length === 1 ? "" : "s"}.`;
  }
  if (subjectType === "TEAM") {
    const t = facts as Awaited<ReturnType<typeof buildTeamFacts>>;
    if (!t) return "Team data unavailable.";
    return `${t.team.name}${t.team.groupCode ? ` are in Group ${t.team.groupCode}` : ""}. Record: ${t.record.won}W ${t.record.drawn}D ${t.record.lost}L · GF ${t.record.gf} · GA ${t.record.ga} · ${t.record.points} pts.`;
  }
  if (subjectType === "PLAYER") {
    const p = facts as Awaited<ReturnType<typeof buildPlayerFacts>>;
    if (!p) return "Player data unavailable.";
    return `${p.player.name} plays ${p.player.position} for ${p.player.team}. Tournament totals: ${p.totals.goals} goal${p.totals.goals === 1 ? "" : "s"}, ${p.totals.assists} assist${p.totals.assists === 1 ? "" : "s"}.`;
  }
  return "Summary unavailable.";
}

async function persist(
  subjectType: SubjectType,
  subjectId: string,
  contentMd: string,
  dataHash: string,
  modelId: string
) {
  await prisma.aiSummary.upsert({
    where: { subjectType_subjectId_dataHash: { subjectType, subjectId, dataHash } },
    create: { subjectType, subjectId, contentMd, dataHash, modelId },
    update: { contentMd, modelId },
  });
}

async function findCached(subjectType: SubjectType, subjectId: string, dataHash: string) {
  return prisma.aiSummary.findUnique({
    where: { subjectType_subjectId_dataHash: { subjectType, subjectId, dataHash } },
  });
}

async function findLatest(subjectType: SubjectType, subjectId: string) {
  return prisma.aiSummary.findFirst({
    where: { subjectType, subjectId },
    orderBy: { createdAt: "desc" },
  });
}

function appendSources(text: string, citations: string[]): string {
  if (citations.length === 0) return text;
  const seen = new Set<string>();
  const items: string[] = [];
  for (const url of citations) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      if (seen.has(host)) continue;
      seen.add(host);
      items.push(`[${host}](${url})`);
    } catch {
      // Skip malformed URLs from the search backend.
    }
    if (items.length >= 5) break;
  }
  if (items.length === 0) return text;
  return `${text}\n\n**Sources:** ${items.join(" · ")}`;
}

/**
 * Get-or-generate a summary. Returns existing row when the facts haven't
 * changed since the last call. Set `force` to bypass the cache (EDITOR+).
 */
export async function getSummary(
  subjectType: SubjectType,
  subjectId: string,
  opts: { force?: boolean } = {}
): Promise<SummaryResult> {
  const facts = await buildFacts(subjectType, subjectId);
  if (!facts) {
    return {
      contentMd: "Subject not found.",
      cached: false,
      modelId: "n/a",
      generated: "empty_data",
    };
  }

  // Live matches: do not generate per-event. Just show whatever's cached, or a placeholder.
  if (subjectType === "MATCH" && (facts as Awaited<ReturnType<typeof buildMatchFacts>>)!.status === "LIVE") {
    const latest = await findLatest(subjectType, subjectId);
    if (latest) {
      return {
        contentMd: latest.contentMd,
        cached: true,
        modelId: latest.modelId,
        generated: "skipped_live",
      };
    }
    return {
      contentMd:
        "_Live — the AI match summary refreshes at half-time and full-time._",
      cached: false,
      modelId: "n/a",
      generated: "skipped_live",
    };
  }

  const dataHash = hashFacts(facts);

  if (!opts.force) {
    const cached = await findCached(subjectType, subjectId, dataHash);
    if (cached) {
      return {
        contentMd: cached.contentMd,
        cached: true,
        modelId: cached.modelId,
        generated: "ok",
      };
    }
  }

  // No cache hit. Try Perplexity.
  if (!isAiConfigured()) {
    const md = fallbackTemplate(subjectType, facts);
    await persist(subjectType, subjectId, md, dataHash, "fallback/template");
    return {
      contentMd: md,
      cached: false,
      modelId: "fallback/template",
      generated: "ai_unconfigured",
    };
  }

  const modelId = MODELS.narrative;

  async function call(extraSystemRule = "") {
    const system = extraSystemRule
      ? `${STYLE_GUIDE}\n\nADDITIONAL RULE:\n${extraSystemRule}`
      : STYLE_GUIDE;
    return perplexityChat({
      model: modelId,
      system,
      user:
        `Subject type: ${subjectType}. Write the analytics summary in the required format.\n\n` +
        `Facts (JSON):\n${canonicalJson(facts)}`,
      maxTokens: 700,
    });
  }

  try {
    let { text, citations } = await call();
    if (DENYLIST.test(text)) {
      const retry = await call(
        "Your previous draft contained forbidden language. Rewrite it now without ANY mention of betting, odds, wagering, gambling, spreads, parlays, or future result probabilities."
      );
      text = retry.text;
      citations = retry.citations;
    }
    if (DENYLIST.test(text) || !text) {
      const md = fallbackTemplate(subjectType, facts);
      await persist(subjectType, subjectId, md, dataHash, "fallback/template");
      return {
        contentMd: md,
        cached: false,
        modelId: "fallback/template",
        generated: "fallback",
      };
    }
    const withSources = appendSources(text, citations);
    await persist(subjectType, subjectId, withSources, dataHash, modelId);
    return { contentMd: withSources, cached: false, modelId, generated: "ok" };
  } catch (err) {
    console.error("[ai] generation failed:", err);
    const md = fallbackTemplate(subjectType, facts);
    await persist(subjectType, subjectId, md, dataHash, "fallback/template");
    return {
      contentMd: md,
      cached: false,
      modelId: "fallback/template",
      generated: "fallback",
    };
  }
}

/** Fire-and-forget regeneration, called by HT/FT transitions. Logs errors but never throws. */
export function scheduleMatchSummary(matchId: string) {
  if (!isAiConfigured()) return;
  void getSummary("MATCH", matchId, { force: true }).catch((err) => {
    console.error("[ai] schedule failed:", err);
  });
}
