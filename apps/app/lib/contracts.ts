import TimeLendMVPArtifact from "@repo/contracts/TimeLendMVP";
import type { Abi, Address } from "viem";

export const TIME_LEND_ABI = TimeLendMVPArtifact.abi as Abi;

export const TIME_LEND_ADDRESS: Record<number, Address> = {
  43113: "0x75668fe290ff152Bf0bc10ac1C6134BB06C7EbBd",
  43114: "0x0000000000000000000000000000000000000000",
};

export const AVALANCHE_FUJI_CHAIN_ID = 43_113 as const;
export const AVALANCHE_MAINNET_CHAIN_ID = 43_114 as const;

export type CommitmentStatus = 0 | 1 | 2 | 3 | 4;

export const COMMITMENT_STATUS = {
  ACTIVE: 0,
  SUCCEEDED: 1,
  FAILED: 2,
  CLAIMED_BY_USER: 3,
  CLAIMED_BY_PENALTY: 4,
} as const;

export interface Commitment {
  createdAt: bigint;
  deadline: bigint;
  penaltyReceiver: Address;
  proofURI: string;
  stake: bigint;
  status: CommitmentStatus;
  taskURI: string;
  user: Address;
  verifier: Address;
}

export interface CreateCommitmentParams {
  durationSeconds: bigint;
  penaltyReceiver: Address;
  taskURI: string;
  verifier: Address;
}

export const TIME_LEND_CONFIG = {
  abi: TIME_LEND_ABI,
  address: TIME_LEND_ADDRESS,
} as const;
