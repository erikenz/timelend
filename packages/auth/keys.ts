import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      BETTER_AUTH_URL: z.url().optional(),
      BETTER_AUTH_SECRET: z.string().optional(),
    },
    client: {},
    runtimeEnv: {
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    },
  });
