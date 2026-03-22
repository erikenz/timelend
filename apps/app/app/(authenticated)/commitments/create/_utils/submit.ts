import { parseEther } from "viem";
import {
  AVALANCHE_FUJI_CHAIN_ID,
  TIME_LEND_ABI,
  TIME_LEND_ADDRESS,
} from "@/lib/contracts";
import type { CommitmentFormData } from "../types";
import { ensureWalletOnFuji, extractTxHash, getId } from "./ethereum";
import { getFallbackAddresses } from "./form-utils";

/**
 * Minimal backend mutation contract used by this util.
 * We keep the shape narrowly-scoped to the methods we call.
 */
type BackendCreateMutator = {
  mutateAsync: (input: {
    name: string;
    description: string;
    durationSeconds: number;
    stakeAmount: string;
    verifierAddress: `0x${string}`;
  }) => Promise<unknown>;
};

type BackendDeleteMutator =
  | {
      mutateAsync: (input: { id: string }) => Promise<unknown>;
    }
  | undefined;

/**
 * Minimal toast shape we use for notifications.
 */
type ToastApi = {
  error: (m: string) => void;
  success: (m: string) => void;
  info?: (m: string) => void;
};

/**
 * Lightweight typings for the write helpers (wagmi), kept intentionally generic.
 */
type WriteMutateAsyncFn = (params: unknown) => Promise<unknown>;
type WriteMutateFn = (params: unknown) => void;

/**
 * Dependencies passed into submitCommitment.
 *
 * We intentionally keep types minimal and local so the util stays decoupled
 * from a specific library version while still being type-safe.
 */
export type SubmitDeps = {
  isConnected: boolean;
  address?: `0x${string}` | undefined;
  createCommitmentMutation: BackendCreateMutator;
  deleteCommitmentMutation?: BackendDeleteMutator;
  writeMutateAsync?: WriteMutateAsyncFn;
  writeMutate?: WriteMutateFn;
  writeData?: unknown;
  writeIsPending?: boolean;
  chainId?: number;
  setSubmitStatus?: (s: string | null) => void;
  setHash: (h: `0x${string}` | undefined) => void;
  toast: ToastApi;
};

/* -------------------------
 * Small helper functions
 * ------------------------- */

/**
 * Persist the commitment to the backend and return the raw backend result.
 */
async function persistToBackend(
  value: CommitmentFormData,
  createMutator: BackendCreateMutator,
  setSubmitStatus?: (s: string | null) => void
): Promise<unknown> {
  setSubmitStatus?.("Persisting to backend...");
  const result = await createMutator.mutateAsync({
    name: value.name,
    description: value.description,
    durationSeconds: value.durationDays * 24 * 60 * 60,
    stakeAmount: value.stakeAmount,
    verifierAddress:
      value.verifier ||
      ("0x0000000000000000000000000000000000000000" as `0x${string}`),
  });
  setSubmitStatus?.("Persisted to backend");
  return result;
}

/**
 * Build the wallet write parameters expected by the on-chain contract call.
 */
function buildWriteParams(
  value: CommitmentFormData,
  verifierAddr: `0x${string}`,
  penaltyAddr: `0x${string}`,
  auditorAddr: `0x${string}`
) {
  const contractAddr = TIME_LEND_ADDRESS[AVALANCHE_FUJI_CHAIN_ID];
  return {
    address: contractAddr as `0x${string}`,
    abi: TIME_LEND_ABI,
    functionName: "createCommitment",
    chainId: AVALANCHE_FUJI_CHAIN_ID,
    args: [
      BigInt(value.durationDays * 24 * 60 * 60),
      verifierAddr,
      auditorAddr,
      penaltyAddr,
      `ipfs://commitment/${value.name}`,
    ] as const,
    value: parseEther(value.stakeAmount),
  } as const;
}

/**
 * Call the wallet write helper (either mutateAsync or mutate).
 * Returns whatever the write helper returns (unknown).
 */
async function callWalletWrite(
  writeParams: unknown,
  writeMutateAsync?: WriteMutateAsyncFn,
  writeMutate?: WriteMutateFn
): Promise<unknown> {
  if (typeof writeMutateAsync === "function") {
    return await writeMutateAsync(writeParams);
  }
  if (typeof writeMutate === "function") {
    // fire-and-forget
    writeMutate(writeParams);
    return undefined;
  }
  throw new Error("Wallet write function is unavailable");
}

/**
 * Attempt to clean up the backend record if the on-chain action failed.
 */
async function cleanupOnChainFailure(
  backendResult: unknown,
  deleteMutator?: BackendDeleteMutator
) {
  try {
    const id = getId(backendResult);
    if (id && typeof deleteMutator?.mutateAsync === "function") {
      await deleteMutator.mutateAsync({ id });
    }
  } catch (err) {
    // Log but don't throw — cleanup failure should not obscure original error.
    // eslint-disable-next-line no-console
    console.error("Failed to cleanup backend after on-chain error", err);
  }
}

/* -------------------------
 * Public submit function
 * ------------------------- */

/**
 * Submit a commitment:
 * 1. Ensure wallet is on Fuji (if chainId provided).
 * 2. Resolve verifier/penalty addresses (fallback to connected account).
 * 3. Persist to backend.
 * 4. Prepare and call on-chain write.
 * 5. Set transaction hash or appropriate status.
 *
 * All UI-facing notifications are emitted through `deps.toast` and
 * `deps.setSubmitStatus`.
 */
export async function submitCommitment(
  { value }: { value: CommitmentFormData },
  deps: SubmitDeps
): Promise<void> {
  const {
    isConnected,
    address,
    createCommitmentMutation,
    deleteCommitmentMutation,
    writeMutateAsync,
    writeMutate,
    writeData,
    writeIsPending,
    chainId,
    setSubmitStatus,
    setHash,
    toast,
  } = deps;

  if (!isConnected) {
    toast.error("Please connect your wallet first");
    return;
  }

  // If chainId is provided, attempt to ensure the injected wallet is on Fuji.
  if (typeof chainId === "number" && chainId !== AVALANCHE_FUJI_CHAIN_ID) {
    const ok = await ensureWalletOnFuji(chainId, setSubmitStatus, toast);
    if (!ok) {
      // ensureWalletOnFuji already set status / displayed toast as appropriate
      return;
    }
  }

  setSubmitStatus?.("Submitting commitment...");

  // Resolve verifier / penalty addresses (may fallback to connected account)
  const resolved = getFallbackAddresses(
    address,
    value.verifier,
    value.penaltyReceiver
  );
  if (!resolved) {
    toast.error(
      "Connected address required when verifier or penaltyReceiver is empty"
    );
    setSubmitStatus?.("Validation failed");
    return;
  }
  const { verifierAddr, penaltyAddr } = resolved;

  let backendResult: unknown;
  try {
    backendResult = await persistToBackend(
      value,
      createCommitmentMutation,
      setSubmitStatus
    );

    // auditor = connected account or zero address
    const auditorAddr =
      (typeof address === "string" && address) ??
      ("0x0000000000000000000000000000000000000000" as `0x${string}`);

    const writeParams = buildWriteParams(
      value,
      verifierAddr,
      penaltyAddr,
      auditorAddr
    );

    setSubmitStatus?.("Calling wallet...");

    const writeResult = await callWalletWrite(
      writeParams,
      writeMutateAsync,
      writeMutate
    );

    const txHash = extractTxHash(writeResult, writeData);

    if (txHash) {
      setHash(txHash);
      setSubmitStatus?.("Transaction broadcast");
      toast.success("Transaction broadcast — confirm in your wallet");
      return;
    }

    // No tx hash immediately available; set a helpful state.
    setSubmitStatus?.(
      writeIsPending
        ? "Waiting for wallet confirmation"
        : "Awaiting transaction hash"
    );
    toast.success(
      "Commitment created! Please confirm the transaction in your wallet."
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Attempt backend cleanup if needed
    await cleanupOnChainFailure(backendResult, deleteCommitmentMutation);
    toast.error(`Failed to create commitment: ${msg}`);
    setSubmitStatus?.("Submission failed");
  }
}
