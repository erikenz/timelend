import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      PRIVATE_KEY: z.string().optional(),
      // Only expose Fuji RPC for the demo
      AVALANCHE_FUJI_RPC_URL: z.string().optional(),
    },
    client: {
      NEXT_PUBLIC_TIMELEND_ADDRESS_FUJI: z.string().optional(),
      // Client-facing Fuji RPC (prefixed NEXT_PUBLIC)
      NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL: z.string().optional(),
    },
    runtimeEnv: {
      PRIVATE_KEY: process.env.PRIVATE_KEY,
      AVALANCHE_FUJI_RPC_URL: process.env.AVALANCHE_FUJI_RPC_URL,
      NEXT_PUBLIC_TIMELEND_ADDRESS_FUJI:
        process.env.NEXT_PUBLIC_TIMELEND_ADDRESS_FUJI,
      NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL:
        process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL,
    },
  });
