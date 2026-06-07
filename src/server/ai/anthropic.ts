import Anthropic from "@anthropic-ai/sdk";

// Models — keep IDs centralized so a future model swap is one line.
export const MODELS = {
  narrative: "claude-sonnet-4-6", // match / team / player long-form summaries
  caption:   "claude-haiku-4-5-20251001", // short trend bullets (Phase 8 polish)
} as const;

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic | null {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  _client = new Anthropic({ apiKey });
  return _client;
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
