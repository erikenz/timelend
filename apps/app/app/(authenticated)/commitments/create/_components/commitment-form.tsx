import { Button } from "@repo/design-system/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
} from "@repo/design-system/components/ui/field";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import type { FieldApi, ReactFormExtendedApi } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import type React from "react";
import { formatEther, parseEther } from "viem";
import { AVALANCHE_FUJI_CHAIN_ID } from "@/lib/contracts";
import type { CommitmentFormData } from "../types";

/**
 * Local minimal form type.
 *
 * We avoid using `any` and avoid import of the full @tanstack/react-form types
 * here to keep this presentational component decoupled. The page owns the
 * concrete `useForm` instance and provides a `form` object that matches this
 * shape.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Use the concrete TanStack form types for the `form` instance and field API.
 * This avoids custom `any`-ish shapes and keeps the presentational component
 * in sync with the form hook used by the page.
 */
type FormInstance = ReactFormExtendedApi<CommitmentFormData>;
type FieldApiFor<K extends keyof CommitmentFormData> = FieldApi<
  CommitmentFormData,
  K
>;

/* -------------------------------------------------------------------------- */
/* Props                                                                     */
/* -------------------------------------------------------------------------- */

export interface CommitmentFormProps {
  chainId?: number;
  form: FormInstance;
  hash?: `0x${string}` | undefined;
  isConfirming?: boolean;
  isConnected: boolean;
  onCreateClick: (
    e: React.MouseEvent<HTMLButtonElement>
  ) => Promise<void> | void;
  onSwitchToFuji: () => Promise<void>;
  submitStatus?: string | null;
  writeIsPending?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function formatStake(value: string): string {
  try {
    return `${formatEther(parseEther(value || "0"))} AVAX`;
  } catch {
    return "";
  }
}

/* -------------------------------------------------------------------------- */
/* Presentational Pieces                                                      */
/* -------------------------------------------------------------------------- */

export function TestnetBanner({
  onSwitch,
  onFuji,
}: {
  onSwitch: () => Promise<void>;
  onFuji: boolean;
}) {
  if (onFuji) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-3 text-green-800 text-sm">
        Wallet is on Avalanche Fuji (testnet). You can submit commitments.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          This form only works on the Avalanche Fuji testnet (chain id 43113).
          Please switch your wallet to Fuji to submit commitments.
        </div>
        <div>
          <Button
            className="ml-2"
            onClick={async () => {
              // Delegate actual switching and feedback to the page-level handler.
              try {
                await onSwitch();
              } catch (err) {
                // Page should surface errors via toasts; keep this component
                // presentational and avoid throwing.
                // eslint-disable-next-line no-console
                console.error("Switch to Fuji failed", err);
              }
            }}
            type="button"
          >
            Switch to Fuji
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FieldRow - small wrapper for the repeated form.Field render pattern        */
/* -------------------------------------------------------------------------- */

/**
 * Thin wrapper around the `form.Field` render API that provides a concise
 * callsite in the presentational JSX. We use the concrete `FieldApi` type
 * for the child callback so callers get accurate typing.
 */
export function FieldRow<K extends keyof CommitmentFormData>(props: {
  form: FormInstance;
  name: K;
  children: (field: FieldApiFor<K>) => React.ReactNode;
}) {
  const { form, name, children } = props;
  // Delegate directly to the TanStack form Field API; types line up because
  // `form` is `ReactFormExtendedApi<CommitmentFormData>` above.
  return form.Field({ name, children });
}

/* -------------------------------------------------------------------------- */
/* CommitmentForm (default export)                                           */
/* -------------------------------------------------------------------------- */

export default function CommitmentForm({
  form,
  isConnected,
  chainId,
  onSwitchToFuji,
  onCreateClick,
  writeIsPending,
  isConfirming,
  submitStatus,
  hash,
}: CommitmentFormProps) {
  const onFuji = chainId === AVALANCHE_FUJI_CHAIN_ID;

  const stakeValue = form.state.values?.stakeAmount ?? "0";
  const stakeDisplay = formatStake(stakeValue);

  return (
    <div className="flex flex-col gap-6">
      <TestnetBanner onFuji={onFuji} onSwitch={onSwitchToFuji} />

      <fieldset className="space-y-6" disabled={!onFuji}>
        <FieldRow form={form} name="name">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <Label htmlFor="name">Commitment Name</Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                id="name"
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.handleChange(e.target.value)
                }
                placeholder="e.g., Complete 30 days of coding"
                value={String(field.state.value ?? "")}
              />
              <FieldError
                errors={(field.state.meta.errors ?? []).filter(
                  (e): e is string => typeof e === "string"
                )}
              />
            </Field>
          )}
        </FieldRow>

        <FieldRow form={form} name="description">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <Label htmlFor="description">Description</Label>
              <Textarea
                aria-invalid={field.state.meta.errors.length > 0}
                id="description"
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(e.target.value)
                }
                placeholder="Describe your commitment in detail"
                value={String(field.state.value ?? "")}
              />
              <FieldError
                errors={(field.state.meta.errors ?? []).filter(
                  (e): e is string => typeof e === "string"
                )}
              />
            </Field>
          )}
        </FieldRow>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow form={form} name="durationDays">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <Label htmlFor="durationDays">Duration (Days)</Label>
                <Input
                  aria-invalid={field.state.meta.errors.length > 0}
                  id="durationDays"
                  min={1}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(Number(e.target.value))
                  }
                  type="number"
                  value={Number(field.state.value ?? 0)}
                />
                <FieldError
                  errors={(field.state.meta.errors ?? []).filter(
                    (e): e is string => typeof e === "string"
                  )}
                />
              </Field>
            )}
          </FieldRow>

          <FieldRow form={form} name="stakeAmount">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <Label htmlFor="stakeAmount">Stake Amount (AVAX)</Label>
                <Input
                  aria-invalid={field.state.meta.errors.length > 0}
                  id="stakeAmount"
                  min={0.01}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(e.target.value)
                  }
                  step={0.01}
                  type="number"
                  value={String(field.state.value ?? "")}
                />
                <FieldDescription className="text-muted-foreground text-sm">
                  {stakeDisplay}
                </FieldDescription>
                <FieldError
                  errors={(field.state.meta.errors ?? []).filter(
                    (e): e is string => typeof e === "string"
                  )}
                />
              </Field>
            )}
          </FieldRow>
        </div>

        <FieldRow form={form} name="verifier">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <Label htmlFor="verifier">Verifier Address</Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                id="verifier"
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.handleChange(e.target.value)
                }
                placeholder="0x..."
                value={String(field.state.value ?? "")}
              />
              <FieldDescription className="text-muted-foreground text-sm">
                The person who will verify your success
              </FieldDescription>
              <FieldError
                errors={(field.state.meta.errors ?? []).filter(
                  (e): e is string => typeof e === "string"
                )}
              />
            </Field>
          )}
        </FieldRow>

        <FieldRow form={form} name="penaltyReceiver">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <Label htmlFor="penaltyReceiver">Penalty Receiver</Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                id="penaltyReceiver"
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.handleChange(e.target.value)
                }
                placeholder="0x..."
                value={String(field.state.value ?? "")}
              />
              <FieldDescription className="text-muted-foreground text-sm">
                Where your stake goes if you fail
              </FieldDescription>
              <FieldError
                errors={(field.state.meta.errors ?? []).filter(
                  (e): e is string => typeof e === "string"
                )}
              />
            </Field>
          )}
        </FieldRow>

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

        <div className="flex gap-2">
          <Button
            className="w-full"
            disabled={
              !isConnected ||
              Boolean(writeIsPending) ||
              Boolean(isConfirming) ||
              !onFuji
            }
            onClick={onCreateClick}
            type="button"
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
        </div>

        {hash && (
          <p className="text-green-600 text-sm">
            Transaction submitted. Hash: {hash}
          </p>
        )}
      </fieldset>
    </div>
  );
}
