import { keys as auth } from "@repo/auth/keys";
import { keys as database } from "@repo/database/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const env = createEnv({
  extends: [database(), auth()],
  server: {
    ANALYZE: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    OPENAI_API_KEY: z.string().optional(),
    PRIVATE_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
    NEXT_PUBLIC_TIMELEND_ADDRESS_FUJI: z.string().optional(),
    NEXT_PUBLIC_TIMELEND_ADDRESS_MAINNET: z.string().optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_TIMELEND_ADDRESS_FUJI:
      process.env.NEXT_PUBLIC_TIMELEND_ADDRESS_FUJI,
    NEXT_PUBLIC_TIMELEND_ADDRESS_MAINNET:
      process.env.NEXT_PUBLIC_TIMELEND_ADDRESS_MAINNET,
    ANALYZE: process.env.ANALYZE,
    NODE_ENV: process.env.NODE_ENV,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
