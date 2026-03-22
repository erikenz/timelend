"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { useForm } from "@tanstack/react-form";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useChainId,
  useConnection,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Header } from "@/app/(authenticated)/_components/header";
import { AVALANCHE_FUJI_CHAIN_ID } from "@/lib/contracts";
import { api } from "@/trpc/react";
import CommitmentForm from "./_components/commitment-form";
import { ensureWalletOnFuji } from "./_utils/ethereum";
import { extractFieldErrors, validateForm } from "./_utils/form-utils";
import {
  type SubmitDeps,
  submitCommitment as submitCommitmentImpl,
} from "./_utils/submit";
import { type CommitmentFormData, commitmentSchema } from "./types";

async function submitCommitment(
  args: { value: CommitmentFormData },
  deps: SubmitDeps
): Promise<void> {
  // Delegate to the shared implementation in _utils/submit.ts so the page stays small
  return submitCommitmentImpl(args, deps);
}

export default function CreateCommitmentPage() {
  const { isConnected, address } = useConnection();
  const chainId = useChainId();
  const onFuji = chainId === AVALANCHE_FUJI_CHAIN_ID;

  const writeHook = useWriteContract();
  const {
    mutateAsync: writeMutateAsync,
    mutate: writeMutate,
    data: writeData,
    isPending: writeIsPending,
  } = writeHook;

  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const createCommitmentMutation = api.commitments.create.useMutation();
  const deleteCommitmentMutation = api.commitments.delete.useMutation();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      durationDays: 7,
      verifier: "",
      penaltyReceiver: "",
      stakeAmount: "0.01",
    } satisfies CommitmentFormData,
    onSubmit: async (args) => {
      // fire-and-forget; submitCommitment will handle errors and status
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
            <CommitmentForm
              chainId={chainId}
              form={form}
              hash={hash}
              isConfirming={isConfirming}
              isConnected={isConnected}
              onCreateClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();

                if (!isConnected) {
                  toast.error("Please connect your wallet to continue");
                  setSubmitStatus?.("Wallet not connected");
                  return;
                }

                if (chainId !== AVALANCHE_FUJI_CHAIN_ID) {
                  toast.error(
                    "Please switch your wallet to Avalanche Fuji (43113) before submitting."
                  );
                  setSubmitStatus?.("Wrong network");
                  return;
                }

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
                  setSubmitStatus?.("Validation failed");
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
                      chainId,
                      setHash,
                      setSubmitStatus,
                      toast,
                    }
                  );
                } catch (err) {
                  console.error("Fallback submitCommitment error", err);
                  setSubmitStatus?.("Fallback submission error (see console)");
                  toast.error("Submission failed — see console for details");
                }
              }}
              onSwitchToFuji={async () => {
                const ok = await ensureWalletOnFuji(
                  chainId,
                  setSubmitStatus,
                  toast
                );
                if (!ok) {
                  return;
                }
                toast.success(
                  "Wallet is now on Avalanche Fuji. You can submit."
                );
                setSubmitStatus?.("On Avalanche Fuji");
              }}
              submitStatus={submitStatus}
              writeIsPending={writeIsPending}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
