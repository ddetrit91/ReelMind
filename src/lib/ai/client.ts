import { anthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

export function getGoogleApiKey() {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
}

export function createGoogleClient() {
  const apiKey = getGoogleApiKey();
  if (!apiKey) return null;
  return createGoogleGenerativeAI({ apiKey });
}

export function getChatModel() {
  const google = createGoogleClient();
  if (google) return google("gemini-3.5-flash-lite");
  if (process.env.OPENAI_API_KEY) return openai("gpt-4o-mini");
  if (process.env.ANTHROPIC_API_KEY) return anthropic("claude-3-5-haiku-latest");
  return null;
}

export function getEmbeddingModel() {
  const google = createGoogleClient();
  if (google) {
    return google.textEmbeddingModel("gemini-embedding-001");
  }
  if (process.env.OPENAI_API_KEY) {
    return openai.embedding("text-embedding-3-small");
  }
  return null;
}
