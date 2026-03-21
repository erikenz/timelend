"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
} from "@repo/design-system/components/ui/field";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatEther, parseEther } from "viem";
import {
  useChainId,
  useConnection,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { z } from "zod";
import { Header } from "@/app/(authenticated)/_components/header";
import {
  AVALANCHE_FUJI_CHAIN_ID,
  TIME_LEND_ABI,
  TIME_LEND_ADDRESS,
} from "@/lib/contracts";
import { api } from "@/trpc/react";

/**
 * Simpler logging approach:
 * - Use browser console.* directly. Removed in-memory capture and UI controls.
 */

/**
 * Form schema & types (Zod)
 */
const HEX_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

const commitmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  durationDays: z.coerce
    .number()
    .int()
    .min(1, "Duration must be at least 1 day"),
  // verifier and penaltyReceiver may be empty in the UI — we'll fallback to the connected account
  verifier: z
    .string()
    .regex(HEX_ADDRESS_RE, "Invalid Ethereum address")
    .or(z.literal("")),
  penaltyReceiver: z
    .string()
    .regex(HEX_ADDRESS_RE, "Invalid Ethereum address")
    .or(z.literal("")),
  stakeAmount: z.string().regex(/^\d+(\.\d+)?$/, "Invalid amount"),
});

type CommitmentFormData = z.infer<typeof commitmentSchema>;

function extractFieldErrors(err: z.ZodError<CommitmentFormData>) {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = issue.path?.length ? issue.path.join(".") : "_";
    out[key] = out[key] ?? [];
    if (issue.message) {
      out[key].push(issue.message);
    }
  }
  return out;
}

function validateForm({ value }: { value: CommitmentFormData }) {
  const result = commitmentSchema.safeParse(value);
  return result.success ? undefined : extractFieldErrors(result.error);
}

function isHexAddress(v: unknown): v is `0x${string}` {
  return typeof v === "string" && HEX_ADDRESS_RE.test(v as string);
}

/**
 * Fallback resolver:
 * - verifier and penaltyReceiver prefer explicit form values when valid.
 * - otherwise they fall back to the connected account.
 */
function getFallbackAddresses(
  connected?: unknown,
  verifier?: string,
  penalty?: string
): { verifierAddr: `0x${string}`; penaltyAddr: `0x${string}` } | null {
  let v: `0x${string}` | undefined;
  let p: `0x${string}` | undefined;

  if (verifier && isHexAddress(verifier)) {
    v = verifier;
  } else if (isHexAddress(connected)) {
    v = connected;
  }

  if (penalty && isHexAddress(penalty)) {
    p = penalty;
  } else if (isHexAddress(connected)) {
    p = connected;
  }

  if (v && p) {
    return { verifierAddr: v, penaltyAddr: p };
  }
  return null;
}

/**
 * Extract tx hash from common shapes (immediate result or hook data)
 */
/**
 * Extract tx hash from common shapes (immediate result or hook data)
 */
function extractTxHash(...candidates: unknown[]): `0x${string}` | undefined {
  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object") {
      const c = candidate as Record<string, unknown>;
      const maybeHash = c.hash ?? c.transactionHash;
      if (typeof maybeHash === "string" && maybeHash.startsWith("0x")) {
        return maybeHash as `0x${string}`;
      }
    }
  }
  return undefined;
}

/**
 * Minimal typed helper for injected providers so we avoid `any`.
 */
type EthProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function getInjectedProvider(): EthProvider | undefined {
  const eth = (globalThis as unknown as { ethereum?: unknown }).ethereum;
  if (eth && typeof (eth as any).request === "function") {
    return eth as EthProvider;
  }
  return undefined;
}

/**
 * Ensure the user's injected wallet is on Avalanche Fuji (43113).
 * Attempts `wallet_switchEthereumChain` and, if necessary, `wallet_addEthereumChain`.
 * Returns true if the wallet is now on Fuji or no action was necessary.
 * Returns false if the process failed or the user needs to take manual action.
 */
async function ensureWalletOnFuji(
  currentChainId?: number,
  setSubmitStatus?: (s: string | null) => void,
  toastArg?: typeof toast
): Promise<boolean> {
  // If chain is unknown or already Fuji, nothing to do.
  if (
    currentChainId === undefined ||
    currentChainId === AVALANCHE_FUJI_CHAIN_ID
  ) {
    return true;
  }

  const provider = getInjectedProvider();
  if (!provider) {
    toastArg?.error(
      "No web3 provider found. Please install MetaMask or another wallet."
    );
    setSubmitStatus?.("No wallet provider");
    return false;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xA869" }], // 0xA869 === 43113
    });
    setSubmitStatus?.(
      "Requested network switch to Avalanche Fuji; please confirm in your wallet"
    );
    toastArg?.info(
      "Requested network switch to Avalanche Fuji; please confirm in your wallet"
    );
    // Caller should abort and allow user to confirm; return false so submit flow doesn't continue immediately.
    return false;
  } catch (err: unknown) {
    // If error indicates chain is not added (4902), try to add it.
    const code = (err as { code?: number })?.code;
    if (code === 4902) {
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xA869",
              chainName: "Avalanche Fuji",
              nativeCurrency: {
                name: "Avalanche",
                symbol: "AVAX",
                decimals: 18,
              },
              rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
              blockExplorerUrls: ["https://testnet.snowtrace.io/"],
            },
          ],
        });
        setSubmitStatus?.(
          "Avalanche Fuji added to wallet; please switch and retry"
        );
        toastArg?.info(
          "Avalanche Fuji added to wallet; please switch and retry"
        );
        return false;
      } catch (addErr: unknown) {
        console.error("wallet_addEthereumChain failed", addErr);
        toastArg?.error(
          "Please switch your wallet to Avalanche Fuji (43113) and try again"
        );
        setSubmitStatus?.("Wrong network");
        return false;
      }
    }

    console.error("wallet_switchEthereumChain failed", err);
    toastArg?.error(
      "Please switch your wallet to Avalanche Fuji (43113) and try again"
    );
    setSubmitStatus?.("Wrong network");
    return false;
  }
}

/**
 * Core submit flow
 * - Persist to backend first
 * - Then call the contract `createCommitment` with the full arg list:
 *   (durationSeconds, verifier, auditor, penaltyReceiver, taskURI)
 */
async function submitCommitment(
  { value }: { value: CommitmentFormData },
  deps: {
    isConnected: boolean;
    // account.address may be undefined
    address?: `0x${string}` | undefined;
    createCommitmentMutation: ReturnType<
      typeof api.commitments.create.useMutation
    >;
    // mutation to delete backend commitment if on-chain write fails
    deleteCommitmentMutation?: ReturnType<
      typeof api.commitments.delete.useMutation
    >;
    // wagmi write helpers (typed via ReturnType of useWriteContract)
    writeMutateAsync?: ReturnType<typeof useWriteContract>["mutateAsync"];
    writeMutate?: ReturnType<typeof useWriteContract>["mutate"];
    writeData?: ReturnType<typeof useWriteContract>["data"];
    writeIsPending?: ReturnType<typeof useWriteContract>["isPending"];
    // optionally pass the current wallet chain id so submission logic can validate it
    chainId?: number;
    setSubmitStatus?: (s: string | null) => void;
    setHash: (h: `0x${string}` | undefined) => void;
    toast: typeof toast;
  }
) {
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

  // If caller provided the current wallet chainId, ensure the wallet is on Avalanche Fuji.
  // If not, attempt a programmatic switch/add via the injected provider and abort this attempt.
  if (typeof chainId === "number" && chainId !== AVALANCHE_FUJI_CHAIN_ID) {
    // Use typed helper to attempt switching/adding the chain. The helper returns false
    // if the operation failed or requires the user to confirm a change, so we abort.
    const ok = await ensureWalletOnFuji(chainId, setSubmitStatus, toast);
    if (!ok) {
      return;
    }
  }
  console.log("Submitting commitment (ui values):", value);
  setSubmitStatus?.("Submitting commitment...");
  // Declare backendResult up-front so we can attempt cleanup if the on-chain write fails.
  let backendResult: unknown;

  try {
    const resolved = getFallbackAddresses(
      address,
      value.verifier,
      value.penaltyReceiver
    );
    if (!resolved) {
      toast.error(
        "Connected address required when verifier or penaltyReceiver is empty"
      );
      return;
    }
    const { verifierAddr, penaltyAddr } = resolved;

    setSubmitStatus?.("Persisting to backend...");
    console.log("Persisting to backend", {
      name: value.name,
      durationDays: value.durationDays,
      stakeAmount: value.stakeAmount,
      verifierAddr,
      penaltyAddr,
    });

    backendResult = await createCommitmentMutation.mutateAsync({
      name: value.name,
      description: value.description,
      durationSeconds: value.durationDays * 24 * 60 * 60,
      stakeAmount: value.stakeAmount,
      verifierAddress: verifierAddr,
    });

    console.log("Backend persist result:", backendResult);
    setSubmitStatus?.("Persisted to backend");

    // Ensure we pass the full arg list expected by the contract ABI:
    // (durationSeconds, verifier, auditor, penaltyReceiver, taskURI)
    // auditor is the connected account (address)
    const auditorAddr = (address ??
      "0x0000000000000000000000000000000000000000") as `0x${string}`;

    const writeParams = {
      address: TIME_LEND_ADDRESS[AVALANCHE_FUJI_CHAIN_ID] as `0x${string}`,
      abi: TIME_LEND_ABI,
      functionName: "createCommitment",
      chainId: AVALANCHE_FUJI_CHAIN_ID,
      args: [
        BigInt(value.durationDays * 24 * 60 * 60),
        verifierAddr,
        auditorAddr,
        penaltyAddr,
        `ipfs://commitment/${value.name}`,
      ],
      value: parseEther(value.stakeAmount),
    };

    console.log("Calling wallet with writeParams:", writeParams);
    setSubmitStatus?.("Calling wallet...");

    let writeResult: unknown;
    if (typeof writeMutateAsync === "function") {
      console.log("Using mutateAsync to write contract");
      writeResult = await writeMutateAsync(
        writeParams as unknown as Parameters<typeof writeMutateAsync>[0]
      );
      setSubmitStatus?.("Write submitted (mutateAsync)");
    } else if (typeof writeMutate === "function") {
      console.log("Using mutate (fire-and-forget) to write contract");
      writeMutate(writeParams as unknown as Parameters<typeof writeMutate>[0]);
      setSubmitStatus?.("Write triggered (mutate)");
    } else {
      toast.error("Wallet write function is unavailable");
      setSubmitStatus?.("Wallet write unavailable");
      return;
    }

    const txHash = extractTxHash(writeResult, writeData);
    console.log("Extracted txHash:", txHash, { writeResult, writeData });

    if (txHash) {
      setHash(txHash);
      setSubmitStatus?.("Transaction broadcast");
    } else {
      setSubmitStatus?.(
        writeIsPending
          ? "Waiting for wallet confirmation"
          : "Awaiting transaction hash"
      );
    }

    if (writeIsPending) {
      toast.success("Transaction is pending — please confirm in your wallet.");
    } else {
      toast.success(
        "Commitment created! Please confirm the transaction in your wallet."
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("createCommitment error:", err);

    // If we persisted to the backend but the on-chain transaction failed,
    // attempt to delete the backend record to keep data consistent.
    try {
      if (
        typeof deleteCommitmentMutation?.mutateAsync === "function" &&
        backendResult &&
        (backendResult as any).id
      ) {
        // eslint-disable-next-line no-console
        console.log("On-chain write failed; deleting backend commitment", {
          id: (backendResult as any).id,
        });
        await deleteCommitmentMutation.mutateAsync({
          id: (backendResult as any).id,
        });
        // eslint-disable-next-line no-console
        console.log("Deleted backend commitment", {
          id: (backendResult as any).id,
        });
      }
    } catch (deleteErr) {
      console.error(
        "Failed to delete backend commitment after on-chain failure",
        deleteErr
      );
    }

    toast.error(`Failed to create commitment: ${msg}`);
    setSubmitStatus?.("Submission failed");
  }
}

export default function CreateCommitmentPage() {
  const { isConnected, address } = useConnection();
  const chainId = useChainId();

  const writeHook = useWriteContract();
  const {
    mutateAsync: writeMutateAsync,
    mutate: writeMutate,
    data: writeData,
    isPending: writeIsPending,
  } = writeHook;

  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Client-only mount guard to avoid hydration mismatch when rendering
  // elements that rely on the injected provider (window.ethereum).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const createCommitmentMutation = api.commitments.create.useMutation();
  const deleteCommitmentMutation = api.commitments.delete.useMutation();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      durationDays: 7,
      verifier: "",
      penaltyReceiver: "",
      stakeAmount: "0.1",
    } satisfies CommitmentFormData,
    onSubmit: async (args) => {
      console.log("Form onSubmit triggered", args);
      // call helper (no-floating-promises in original; awaiting here)
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      submitCommitment(args, {
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
      });
    },
    validators: {
      onSubmit: validateForm,
      onChange: validateForm,
    },
  });

  return (
    <>
      <Header page="Create Commitment" pages={["Commitments", "Create"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Create New Commitment</CardTitle>
            <CardDescription>
              Stake your AVAX and commit to achieving your goal. If you succeed,
              your stake is returned. If you fail, the stake goes to the penalty
              receiver.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-6"
              onSubmit={(e) => {
                e.preventDefault();
                // quick client-side validation using zod mirror
                const validation = commitmentSchema.safeParse(
                  form.state.values as CommitmentFormData
                );
                if (!validation.success) {
                  const errs = extractFieldErrors(validation.error);
                  const messages = Object.entries(errs).flatMap(([k, v]) =>
                    v ? v.map((m) => `${k}: ${m}`) : []
                  );
                  toast.error(
                    messages.length
                      ? messages.join("; ")
                      : "Please fix form errors before submitting"
                  );
                  setSubmitStatus?.("Validation failed");
                  return;
                }
                form.handleSubmit();
              }}
            >
              <form.Field name="name">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <Label htmlFor="name">Commitment Name</Label>
                    <Input
                      aria-invalid={field.state.meta.errors.length > 0}
                      id="name"
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., Complete 30 days of coding"
                      value={field.state.value}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="description">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      aria-invalid={field.state.meta.errors.length > 0}
                      id="description"
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Describe your commitment in detail"
                      value={field.state.value}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field name="durationDays">
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0}>
                      <Label htmlFor="durationDays">Duration (Days)</Label>
                      <Input
                        aria-invalid={field.state.meta.errors.length > 0}
                        id="durationDays"
                        min={1}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(Number(e.target.value))
                        }
                        type="number"
                        value={field.state.value}
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="stakeAmount">
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0}>
                      <Label htmlFor="stakeAmount">Stake Amount (AVAX)</Label>
                      <Input
                        aria-invalid={field.state.meta.errors.length > 0}
                        id="stakeAmount"
                        min={0.01}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        step={0.01}
                        type="number"
                        value={field.state.value}
                      />
                      <FieldDescription className="text-muted-foreground text-sm">
                        = {formatEther(parseEther(field.state.value || "0"))}{" "}
                        AVAX
                      </FieldDescription>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
              </div>

              <form.Field name="verifier">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <Label htmlFor="verifier">Verifier Address</Label>
                    <Input
                      aria-invalid={field.state.meta.errors.length > 0}
                      id="verifier"
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="0x..."
                      value={field.state.value}
                    />
                    <FieldDescription className="text-muted-foreground text-sm">
                      The person who will verify your success
                    </FieldDescription>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="penaltyReceiver">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <Label htmlFor="penaltyReceiver">Penalty Receiver</Label>
                    <Input
                      aria-invalid={field.state.meta.errors.length > 0}
                      id="penaltyReceiver"
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="0x..."
                      value={field.state.value}
                    />
                    <FieldDescription className="text-muted-foreground text-sm">
                      Where your stake goes if you fail
                    </FieldDescription>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              {!isConnected && (
                <p className="text-destructive text-sm">
                  Please connect your wallet to create a commitment
                </p>
              )}

              {submitStatus && (
                <p className="text-muted-foreground text-sm">
                  Status: {submitStatus}
                </p>
              )}

              {mounted && (
                <div className="flex gap-2">
                  <button
                    className="rounded bg-blue-100 px-3 py-1 text-sm"
                    onClick={async () => {
                      const ok = await ensureWalletOnFuji(
                        chainId,
                        setSubmitStatus,
                        toast
                      );
                      if (!ok) {
                        // ensureWalletOnFuji already displayed an appropriate toast/status
                        return;
                      }
                      toast.success(
                        "Wallet is now on Avalanche Fuji. You can submit."
                      );
                      setSubmitStatus?.("On Avalanche Fuji");
                    }}
                    type="button"
                  >
                    Switch to Fuji
                  </button>
                </div>
              )}

              <Button
                className="w-full"
                disabled={
                  !isConnected ||
                  Boolean(writeIsPending) ||
                  isConfirming ||
                  chainId !== AVALANCHE_FUJI_CHAIN_ID
                }
                onClick={async (e) => {
                  e.preventDefault();

                  // Ensure wallet is connected before proceeding
                  if (!isConnected) {
                    toast.error("Please connect your wallet to continue");
                    setSubmitStatus?.("Wallet not connected");
                    return;
                  }

                  // Block submission if wallet is not on Fuji; user may press 'Switch to Fuji' above
                  if (chainId !== AVALANCHE_FUJI_CHAIN_ID) {
                    toast.error(
                      "Please switch your wallet to Avalanche Fuji (43113) before submitting."
                    );
                    setSubmitStatus?.("Wrong network");
                    return;
                  }

                  console.log("Create button clicked (UI)", {
                    values: form.state.values,
                  });
                  setSubmitStatus?.("Button clicked — validating");

                  const validation = commitmentSchema.safeParse(
                    form.state.values as CommitmentFormData
                  );
                  if (!validation.success) {
                    const errs = extractFieldErrors(validation.error);
                    const messages = Object.entries(errs).flatMap(([k, v]) =>
                      v ? v.map((m) => `${k}: ${m}`) : []
                    );
                    const msg = messages.length
                      ? messages.join("; ")
                      : "Please fix form errors before submitting";
                    console.log("Form validation failed:", messages);
                    setSubmitStatus?.("Validation failed — see console");
                    toast.error(msg);
                    return;
                  }

                  setSubmitStatus?.("Validation passed — submitting");
                  try {
                    form.handleSubmit();
                  } catch (err) {
                    console.error("form.handleSubmit threw", err);
                  }

                  try {
                    setSubmitStatus?.(
                      "Fallback: calling submitCommitment directly"
                    );
                    await submitCommitment(
                      { value: form.state.values as CommitmentFormData },
                      {
                        isConnected,
                        address,
                        createCommitmentMutation,
                        deleteCommitmentMutation,
                        writeMutateAsync,
                        writeMutate,
                        writeData,
                        writeIsPending,
                        setHash,
                        setSubmitStatus,
                        toast,
                      }
                    );
                    console.log("Fallback submitCommitment returned");
                  } catch (err) {
                    console.error("Fallback submitCommitment error", err);
                    setSubmitStatus?.(
                      "Fallback submission error (see console)"
                    );
                    toast.error("Submission failed — see console for details");
                  }
                }}
                type="submit"
              >
                {writeIsPending || isConfirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin data-[icon=inline-start]:mr-2" />
                    {writeIsPending ? "Waiting for wallet..." : "Confirming..."}
                  </>
                ) : (
                  "Create Commitment"
                )}
              </Button>

              {isConfirmed && hash && (
                <p className="text-green-600 text-sm">
                  Transaction confirmed! Hash: {hash}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
