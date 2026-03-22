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
  FieldGroup,
  FieldLabel,
} from "@repo/design-system/components/ui/field";
import { Input } from "@repo/design-system/components/ui/input";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { formatEther, parseEther } from "viem";
import {
  useChainId,
  useConnection,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Header } from "@/app/(authenticated)/_components/header";
import {
  AVALANCHE_FUJI_CHAIN_ID,
  TIME_LEND_ABI,
  TIME_LEND_ADDRESS,
} from "@/lib/contracts";
import { api } from "@/trpc/react";
import { TestnetBanner } from "./_components/testnet-banner";
import { ensureWalletOnFuji } from "./_utils/ethereum";
import { getFallbackAddresses } from "./_utils/form-utils";
import { type CommitmentFormData, commitmentSchema } from "./types";

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                        */
/* -------------------------------------------------------------------------- */

export default function CreateCommitmentPage() {
  const router = useRouter();
  const { isConnected, address } = useConnection();
  const chainId = useChainId();
  const isOnFuji = chainId === AVALANCHE_FUJI_CHAIN_ID;

  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [pendingFormData, setPendingFormData] =
    useState<CommitmentFormData | null>(null);

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isTxError,
    data: txReceipt,
  } = useWaitForTransactionReceipt({ hash });

  const writeContract = useWriteContract();
  const createCommitmentMutation = api.commitments.create.useMutation();
  const syncWithContractMutation =
    api.commitments.syncWithContract.useMutation();

  const previousHashRef = useRef<`0x${string}` | undefined>(undefined);
  const hasPersistedRef = useRef(false);

  const form = useForm<CommitmentFormData>({
    defaultValues: {
      name: "",
      description: "",
      durationDays: 7,
      verifier: "",
      penaltyReceiver: "",
      stakeAmount: "0.01",
    },
    validators: {
      onSubmit: commitmentSchema,
    },
    onSubmit: async ({ value }) => {
      if (!isConnected) {
        toast.error("Please connect your wallet to continue");
        return;
      }

      if (chainId !== AVALANCHE_FUJI_CHAIN_ID) {
        toast.error(
          "Please switch your wallet to Avalanche Fuji (43113) before submitting."
        );
        return;
      }

      const resolved = getFallbackAddresses(
        address,
        value.verifier,
        value.penaltyReceiver
      );
      if (!resolved) {
        toast.error(
          "Please enter valid verifier and penalty receiver addresses"
        );
        return;
      }

      setPendingFormData(value);
      hasPersistedRef.current = false;
      setSubmitStatus("Submitting transaction...");

      const ok = await ensureWalletOnFuji(chainId, setSubmitStatus, toast);
      if (!ok) {
        setPendingFormData(null);
        return;
      }

      const durationSeconds = BigInt(value.durationDays * 24 * 60 * 60);
      const stakeValue = parseEther(value.stakeAmount);

      writeContract.mutate(
        {
          address: TIME_LEND_ADDRESS[AVALANCHE_FUJI_CHAIN_ID],
          abi: TIME_LEND_ABI,
          functionName: "createCommitment",
          args: [
            durationSeconds,
            resolved.verifierAddr,
            address!,
            resolved.penaltyAddr,
            `ipfs://commitment/${value.name}`,
          ],
          value: stakeValue,
        },
        {
          onSuccess: (txHash) => {
            setHash(txHash);
            setSubmitStatus("Transaction sent - waiting for confirmation...");
            toast.success("Transaction sent!");
          },
          onError: (error) => {
            console.error("Transaction error:", error);
            toast.error(
              `Transaction failed: ${error.shortMessage ?? error.message}`
            );
            setSubmitStatus("Transaction failed");
            setPendingFormData(null);
          },
        }
      );
    },
  });

  // Handle transaction hash being set
  useEffect(() => {
    if (!hash || hash === previousHashRef.current) {
      return;
    }
    previousHashRef.current = hash;
    setSubmitStatus("Transaction sent - waiting for confirmation...");
  }, [hash]);

  // Handle transaction confirmation
  useEffect(() => {
    if (!(isConfirmed && pendingFormData && hash)) {
      return;
    }

    if (hasPersistedRef.current) {
      return;
    }
    hasPersistedRef.current = true;

    setSubmitStatus("Transaction confirmed! Saving commitment...");

    const formDataSnapshot = pendingFormData;
    const hashSnapshot = hash;

    // Parse the CommitmentCreated event to get the on-chain commitment ID
    let onChainCommitmentId: bigint | undefined;
    const commitmentCreatedTopic =
      "0x0643d22604ae640e3d16aa62509ab80a14544d2dc0ed9d13477e8989b7ceb189";
    console.log("[Create Debug] Parsing logs for commitment ID", {
      txReceiptLogs: txReceipt?.logs?.length,
      expectedAddress: TIME_LEND_ADDRESS[AVALANCHE_FUJI_CHAIN_ID].toLowerCase(),
      expectedTopic: commitmentCreatedTopic,
    });
    if (txReceipt?.logs) {
      for (const log of txReceipt.logs) {
        console.log("[Create Debug] Log:", {
          address: log.address.toLowerCase(),
          topic0: log.topics[0],
          topicsMatch: log.topics[0] === commitmentCreatedTopic,
          addressMatch:
            log.address.toLowerCase() ===
            TIME_LEND_ADDRESS[AVALANCHE_FUJI_CHAIN_ID].toLowerCase(),
        });
        // Check if log address matches our contract and has the event signature
        if (
          log.address.toLowerCase() ===
            TIME_LEND_ADDRESS[AVALANCHE_FUJI_CHAIN_ID].toLowerCase() &&
          log.topics[0] === commitmentCreatedTopic
        ) {
          // First topic after the event signature is the commitmentId
          onChainCommitmentId = BigInt(log.topics[1]);
          console.log(
            "[Create Debug] Found commitment ID:",
            onChainCommitmentId.toString()
          );
          break;
        }
      }
    }

    createCommitmentMutation
      .mutateAsync({
        name: formDataSnapshot.name,
        description: formDataSnapshot.description,
        durationSeconds: formDataSnapshot.durationDays * 24 * 60 * 60,
        stakeAmount: formDataSnapshot.stakeAmount,
        verifierAddress:
          formDataSnapshot.verifier ||
          ("0x0000000000000000000000000000000000000000" as `0x${string}`),
      })
      .then(async (result) => {
        // Sync with on-chain data if we have the commitment ID
        console.log("[Create Debug] Creating DB record, sync data:", {
          dbId: result.id,
          onChainCommitmentId: onChainCommitmentId?.toString(),
          shouldSync: onChainCommitmentId !== undefined,
        });
        if (onChainCommitmentId === undefined) {
          console.log("[Create Debug] Skipping sync - no onChainCommitmentId");
        } else {
          console.log("[Create Debug] Calling syncWithContract...");
          await syncWithContractMutation.mutateAsync({
            commitmentId: result.id,
            onChainCommitmentId,
          });
          console.log("[Create Debug] Sync completed");
        }
        toast.success("Commitment created successfully!");
        router.push(`/commitments/${result.id}`);
      })
      .catch((err) => {
        console.error("Failed to save commitment to database:", err);
        toast.error(
          `Transaction confirmed but failed to save to database. Please contact support with tx: ${hashSnapshot}`
        );
        setSubmitStatus("Database save failed - contact support");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, pendingFormData, hash, txReceipt]);

  // Handle transaction failure
  useEffect(() => {
    if (!(isTxError && hash)) {
      return;
    }

    toast.error("Transaction failed on-chain. No commitment was created.");
    setSubmitStatus("Transaction failed - no commitment created");
    setPendingFormData(null);
  }, [isTxError, hash]);

  const handleSwitchToFuji = useCallback(async () => {
    const ok = await ensureWalletOnFuji(chainId, setSubmitStatus, toast);
    if (ok) {
      toast.success("Wallet is now on Avalanche Fuji. You can submit.");
      setSubmitStatus("On Avalanche Fuji");
    }
  }, [chainId]);

  const isSubmitting = isConfirming || writeContract.isPending;

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
            <TestnetBanner isOnFuji={isOnFuji} onSwitch={handleSwitchToFuji} />

            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
            >
              <FieldGroup>
                <form.Field
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Commitment Name
                        </FieldLabel>
                        <Input
                          aria-invalid={isInvalid}
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="e.g., Complete 30 days of coding"
                          value={field.state.value}
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                  name="name"
                />

                <form.Field
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Description
                        </FieldLabel>
                        <Textarea
                          aria-invalid={isInvalid}
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Describe your commitment in detail"
                          rows={4}
                          value={field.state.value}
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                  name="description"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <form.Field
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            Duration (Days)
                          </FieldLabel>
                          <Input
                            aria-invalid={isInvalid}
                            id={field.name}
                            min={1}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(e) =>
                              field.handleChange(Number(e.target.value))
                            }
                            type="number"
                            value={field.state.value}
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                    name="durationDays"
                  />

                  <form.Field
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      let stakeDisplay = "";
                      try {
                        stakeDisplay = `${formatEther(
                          parseEther(field.state.value || "0")
                        )} AVAX`;
                      } catch {
                        stakeDisplay = "";
                      }
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            Stake Amount (AVAX)
                          </FieldLabel>
                          <Input
                            aria-invalid={isInvalid}
                            id={field.name}
                            min={0.01}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            step={0.01}
                            type="number"
                            value={field.state.value}
                          />
                          <FieldDescription className="text-muted-foreground text-sm">
                            {stakeDisplay}
                          </FieldDescription>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                    name="stakeAmount"
                  />
                </div>

                <form.Field
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Verifier Address
                        </FieldLabel>
                        <Input
                          aria-invalid={isInvalid}
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0x..."
                          value={field.state.value}
                        />
                        <FieldDescription className="text-muted-foreground text-sm">
                          The person who will verify your success
                        </FieldDescription>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                  name="verifier"
                />

                <form.Field
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Penalty Receiver
                        </FieldLabel>
                        <Input
                          aria-invalid={isInvalid}
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0x..."
                          value={field.state.value}
                        />
                        <FieldDescription className="text-muted-foreground text-sm">
                          Where your stake goes if you fail
                        </FieldDescription>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                  name="penaltyReceiver"
                />
              </FieldGroup>

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

              <form.Subscribe
                children={([canSubmit, isFormSubmitting]) => (
                  <div className="flex gap-2">
                    <Button
                      className="w-full"
                      disabled={
                        !(isConnected && canSubmit) ||
                        isFormSubmitting ||
                        isSubmitting
                      }
                      type="submit"
                    >
                      {isSubmitting || isFormSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin data-[icon=inline-start]:mr-2" />
                          {writeContract.isPending
                            ? "Waiting for wallet..."
                            : "Confirming..."}
                        </>
                      ) : (
                        "Create Commitment"
                      )}
                    </Button>
                  </div>
                )}
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              />

              {hash && (
                <p className="text-green-600 text-sm">
                  Transaction submitted. Hash: {hash}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
