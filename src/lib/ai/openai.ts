import OpenAI from "openai";

let openaiInstance: OpenAI | null = null;
let cachedKey: string | null = null;

export const AI_STRATEGY_MODEL = "gpt-5.4-mini";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  console.log("[openai] OPENAI_API_KEY present:", apiKey ? "yes" : "no");

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  if (!openaiInstance || cachedKey !== apiKey) {
    openaiInstance = new OpenAI({ apiKey });
    cachedKey = apiKey;
  }

  return openaiInstance;
}
