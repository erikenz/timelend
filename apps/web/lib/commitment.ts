import { formatEther, type Address, type PublicClient } from "viem";

import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contract";

export type CommitmentDetails = {
  user: Address;
  verifier: Address;
  penaltyReceiver: Address;
  stake: bigint;
  createdAt: bigint;
  deadline: bigint;
  status: number;
  taskURI: string;
  proofURI: string;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const getCommitment = async (
  publicClient: PublicClient,
  commitmentId: bigint,
) => {
  const commitment = (await publicClient.readContract({
    abi: CONTRACT_ABI,
    address: CONTRACT_ADDRESS,
    functionName: "getCommitment",
    args: [commitmentId],
  })) as CommitmentDetails;

  return commitment;
};

export const isValidCommitment = (commitment: CommitmentDetails) =>
  commitment.user !== ZERO_ADDRESS;

export const formatStake = (stake: bigint) => `${formatEther(stake)} AVAX`;
