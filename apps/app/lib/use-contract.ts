"use client";

import { type Hash, parseEther } from "viem";
import {
  useChainId,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  AVALANCHE_FUJI_CHAIN_ID,
  type CreateCommitmentParams,
  TIME_LEND_ABI,
  TIME_LEND_ADDRESS,
} from "./contracts";

interface ContractWriteResult {
  error: Error | null;
  hash: Hash | undefined;
  isConfirmed: boolean;
  isConfirming: boolean;
  isPending: boolean;
}

type ContractWriteAction = (commitmentId: bigint, ...args: string[]) => void;

export function useCommitment(commitmentId: bigint) {
  const chainId = useChainId();
  const address =
    TIME_LEND_ADDRESS[chainId] ?? TIME_LEND_ADDRESS[AVALANCHE_FUJI_CHAIN_ID];

  return useReadContract({
    address,
    abi: TIME_LEND_ABI,
    functionName: "getCommitment",
    args: [commitmentId],
  });
}

export function useNextCommitmentId() {
  const chainId = useChainId();
  const address =
    TIME_LEND_ADDRESS[chainId] ?? TIME_LEND_ADDRESS[AVALANCHE_FUJI_CHAIN_ID];

  return useReadContract({
    address,
    abi: TIME_LEND_ABI,
    functionName: "nextCommitmentId",
  });
}

export function useCreateCommitment(): ContractWriteResult & {
  createCommitment: (
    params: CreateCommitmentParams,
    stakeAmount: string
  ) => void;
} {
  const chainId = useChainId();
  const address =
    TIME_LEND_ADDRESS[chainId] ?? TIME_LEND_ADDRESS[AVALANCHE_FUJI_CHAIN_ID];

  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const createCommitment = (
    params: CreateCommitmentParams,
    stakeAmount: string
  ) => {
    writeContract({
      address,
      abi: TIME_LEND_ABI,
      functionName: "createCommitment",
      args: [
        params.durationSeconds,
        params.verifier,
        params.penaltyReceiver,
        params.taskURI,
      ],
      value: parseEther(stakeAmount),
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  return {
    createCommitment,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useSubmitProof(): ContractWriteResult & {
  submitProof: ContractWriteAction;
} {
  const chainId = useChainId();
  const address =
    TIME_LEND_ADDRESS[chainId] ?? TIME_LEND_ADDRESS[AVALANCHE_FUJI_CHAIN_ID];

  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const submitProof = (commitmentId: bigint, proofURI: string) => {
    writeContract({
      address,
      abi: TIME_LEND_ABI,
      functionName: "submitProof",
      args: [commitmentId, proofURI],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  return {
    submitProof,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useVerifySuccess(): ContractWriteResult & {
  verifySuccess: (commitmentId: bigint) => void;
} {
  const chainId = useChainId();
  const address =
    TIME_LEND_ADDRESS[chainId] ?? TIME_LEND_ADDRESS[AVALANCHE_FUJI_CHAIN_ID];

  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const verifySuccess = (commitmentId: bigint) => {
    writeContract({
      address,
      abi: TIME_LEND_ABI,
      functionName: "verifySuccess",
      args: [commitmentId],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  return {
    verifySuccess,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useClaimSuccess(): ContractWriteResult & {
  claimSuccess: (commitmentId: bigint) => void;
} {
  const chainId = useChainId();
  const address =
    TIME_LEND_ADDRESS[chainId] ?? TIME_LEND_ADDRESS[AVALANCHE_FUJI_CHAIN_ID];

  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const claimSuccess = (commitmentId: bigint) => {
    writeContract({
      address,
      abi: TIME_LEND_ABI,
      functionName: "claimSuccess",
      args: [commitmentId],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  return {
    claimSuccess,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useClaimPenalty(): ContractWriteResult & {
  claimPenalty: (commitmentId: bigint) => void;
} {
  const chainId = useChainId();
  const address =
    TIME_LEND_ADDRESS[chainId] ?? TIME_LEND_ADDRESS[AVALANCHE_FUJI_CHAIN_ID];

  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const claimPenalty = (commitmentId: bigint) => {
    writeContract({
      address,
      abi: TIME_LEND_ABI,
      functionName: "claimPenalty",
      args: [commitmentId],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  return {
    claimPenalty,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useMarkFailed(): ContractWriteResult & {
  markFailed: (commitmentId: bigint) => void;
} {
  const chainId = useChainId();
  const address =
    TIME_LEND_ADDRESS[chainId] ?? TIME_LEND_ADDRESS[AVALANCHE_FUJI_CHAIN_ID];

  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const markFailed = (commitmentId: bigint) => {
    writeContract({
      address,
      abi: TIME_LEND_ABI,
      functionName: "markFailed",
      args: [commitmentId],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  return {
    markFailed,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}
