import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "@ai-sdk/provider";
import { keys } from "../keys";

const openai = createOpenAI({
  apiKey: keys().OPENAI_API_KEY,
});

export const models: {
  chat: LanguageModelV1;
  embeddings: LanguageModelV1;
} = {
  chat: openai("gpt-4o-mini"),
  embeddings: openai("text-embedding-3-small"),
};
