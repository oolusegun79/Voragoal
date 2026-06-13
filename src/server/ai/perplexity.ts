// Perplexity AI client — OpenAI-compatible chat completions with built-in web
// search. We use the `sonar` model which combines an LLM with live retrieval,
// so summaries for finished/live matches can include factual context beyond
// our own DB (post-match reports, lineups, quotes) while still grounded in the
// facts blob we pass.

export const MODELS = {
  narrative: "sonar",
} as const;

export function isAiConfigured(): boolean {
  return Boolean(process.env.PERPLEXITY_API_KEY);
}

type PerplexityMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type PerplexityResponse = {
  id: string;
  model: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  citations?: string[];
  usage?: { prompt_tokens: number; completion_tokens: number };
};

export async function perplexityChat(opts: {
  model: string;
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<{ text: string; citations: string[] }> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) throw new Error("PERPLEXITY_API_KEY not configured");

  const messages: PerplexityMessage[] = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user },
  ];

  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      messages,
      max_tokens: opts.maxTokens ?? 700,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Perplexity ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const json = (await res.json()) as PerplexityResponse;
  const text = json.choices[0]?.message?.content ?? "";
  const citations = json.citations ?? [];
  return { text: text.trim(), citations };
}
