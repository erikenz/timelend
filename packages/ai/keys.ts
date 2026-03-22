import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
      OPENAI_API_KEY: z.string().startsWith("sk-").optional(),
      VERCEL_API_KEY: z.string().optional(),
    },
    runtimeEnv: {
      GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      VERCEL_API_KEY: process.env.VERCEL_API_KEY,
    },
  });
