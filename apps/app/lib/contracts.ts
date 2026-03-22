import TimeLendMVPArtifact from "@repo/contracts/TimeLendMVP";
import type { Abi, Address } from "viem";

export const TIME_LEND_ABI = TimeLendMVPArtifact.abi as Abi;

export const TIME_LEND_ADDRESS: Record<number, Address> = {
  43113: "0x6E81D9199646994485bA3630e0097a7015395E7C",
};

export const AVALANCHE_FUJI_CHAIN_ID = 43_113 as const;

export type CommitmentStatus = 0 | 1 | 2 | 3 | 4 | 5;

export const COMMITMENT_STATUS = {
  ACTIVE: 0,
  PENDING_VERIFICATION: 1,
  SUCCEEDED: 2,
  FAILED: 3,
  CLAIMED_BY_USER: 4,
  CLAIMED_BY_PENALTY: 5,
} as const;

export interface Commitment {
  auditor: Address;
  createdAt: bigint;
  deadline: bigint;
  penaltyReceiver: Address;
  proofURI: string;
  qualityScore: number;
  stake: bigint;
  status: CommitmentStatus;
  taskURI: string;
  user: Address;
  verificationNotes: string;
  verifier: Address;
}

export interface CreateCommitmentParams {
  auditor: Address;
  durationSeconds: bigint;
  penaltyReceiver: Address;
  taskURI: string;
  verifier: Address;
}

export const TIME_LEND_CONFIG = {
  abi: TIME_LEND_ABI,
  address: TIME_LEND_ADDRESS,
} as const;
