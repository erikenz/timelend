import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      PRIVATE_KEY: z.string().optional(),
    },
    client: {
      NEXT_PUBLIC_TIMELEND_ADDRESS_FUJI: z.string().optional(),
      NEXT_PUBLIC_TIMELEND_ADDRESS_MAINNET: z.string().optional(),
    },
    runtimeEnv: {
      PRIVATE_KEY: process.env.PRIVATE_KEY,
      NEXT_PUBLIC_TIMELEND_ADDRESS_FUJI:
        process.env.NEXT_PUBLIC_TIMELEND_ADDRESS_FUJI,
      NEXT_PUBLIC_TIMELEND_ADDRESS_MAINNET:
        process.env.NEXT_PUBLIC_TIMELEND_ADDRESS_MAINNET,
    },
  });
