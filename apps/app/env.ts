import { keys as auth } from "@repo/auth/keys";
import { keys as database } from "@repo/database/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const env = createEnv({
  extends: [database(), auth()],
  server: {},
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
