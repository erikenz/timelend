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
import { toast } from "sonner";
import { formatEther, parseEther } from "viem";
import {
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

const commitmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  durationDays: z.coerce
    .number()
    .int()
    .min(1, "Duration must be at least 1 day"),
  verifier: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  penaltyReceiver: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  stakeAmount: z.string().regex(/^\d+(\.\d+)?$/, "Invalid amount"),
});

type CommitmentFormData = z.infer<typeof commitmentSchema>;

function validateForm({ value }: { value: CommitmentFormData }) {
  const result = commitmentSchema.safeParse(value);
  if (!result.success) {
    return result.error.flatten().fieldErrors as Record<string, string[]>;
  }
  return {};
}

export default function CreateCommitmentPage() {
  const { isConnected } = useConnection();

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const createCommitmentMutation = api.commitments.create.useMutation();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      durationDays: 7,
      verifier: "",
      penaltyReceiver: "",
      stakeAmount: "0.1",
    } satisfies CommitmentFormData,
    onSubmit: async ({ value }) => {
      if (!isConnected) {
        toast.error("Please connect your wallet first");
        return;
      }

      try {
        await createCommitmentMutation.mutateAsync({
          name: value.name,
          description: value.description,
          durationSeconds: value.durationDays * 24 * 60 * 60,
          stakeAmount: value.stakeAmount,
          verifierAddress: value.verifier,
        });

        writeContract({
          address: TIME_LEND_ADDRESS[AVALANCHE_FUJI_CHAIN_ID],
          abi: TIME_LEND_ABI,
          functionName: "createCommitment",
          args: [
            BigInt(value.durationDays * 24 * 60 * 60),
            value.verifier as `0x${string}`,
            value.penaltyReceiver as `0x${string}`,
            `ipfs://commitment/${value.name}`,
          ],
          value: parseEther(value.stakeAmount),
        });

        toast.success("Commitment created! Please confirm the transaction.");
      } catch {
        toast.error("Failed to create commitment");
      }
    },
    validators: {
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

              <Button
                className="w-full"
                disabled={
                  !isConnected ||
                  isPending ||
                  isConfirming ||
                  !form.state.canSubmit
                }
                type="submit"
              >
                {isPending || isConfirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin data-[icon=inline-start]:mr-2" />
                    {isPending ? "Waiting for wallet..." : "Confirming..."}
                  </>
                ) : (
                  `Create Commitment (Stake ${form.state.values.stakeAmount || "0"} AVAX)`
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
