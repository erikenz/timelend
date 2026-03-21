import TimeLendMVPArtifact from "@repo/contracts/TimeLendMVP";
import type { Abi } from "viem";
import { env } from "@/env";

export const TIME_LEND_ABI = TimeLendMVPArtifact.abi as Abi;

export const TIME_LEND_ADDRESS = {
  43113: (env.NEXT_PUBLIC_TIMELEND_ADDRESS_FUJI ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  43114: (env.NEXT_PUBLIC_TIMELEND_ADDRESS_MAINNET ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
};

export const TIME_LEND_CONFIG = {
  abi: TIME_LEND_ABI,
  address: TIME_LEND_ADDRESS,
};
