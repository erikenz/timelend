import { keys as auth } from "@repo/auth/keys";
import { keys as contracts } from "@repo/contracts/keys";
import { keys as database } from "@repo/database/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const env = createEnv({
  extends: [database(), auth(), contracts()],
  server: {
    ANALYZE: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    OPENAI_API_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    ANALYZE: process.env.ANALYZE,
    NODE_ENV: process.env.NODE_ENV,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
