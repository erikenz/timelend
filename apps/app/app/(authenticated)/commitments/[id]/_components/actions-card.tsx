import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Loader2 } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { COMMITMENT_STATUS } from "@/lib/contracts";
import {
  useClaimPenalty,
  useClaimSuccess,
  useMarkFailed,
  useSubmitProof,
  useVerifySuccess,
} from "@/lib/use-contract";
import type { OnChainCommitment } from "./on-chain-card";

interface ActionButtonProps {
  buttonText: string;
  description: string;
  isPending: boolean;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
}

function ActionButton({
  label,
  description,
  buttonText,
  onClick,
  isPending,
  variant = "default",
}: ActionButtonProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-muted-foreground text-sm">{description}</p>
      <Button disabled={isPending} onClick={onClick} variant={variant}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : buttonText}
      </Button>
    </div>
  );
}

interface ProofSubmitButtonProps {
  isPending: boolean;
  onSubmit: (uri: string) => void;
}

function ProofSubmitButton({ onSubmit, isPending }: ProofSubmitButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label>Submit Proof of Completion</Label>
      <p className="text-muted-foreground text-sm">
        Submit proof that you completed your commitment.
      </p>
      <div className="flex gap-2">
        <Input className="flex-1" placeholder="ipfs://..." ref={inputRef} />
        <Button
          disabled={isPending}
          onClick={() => {
            const value = inputRef.current?.value;
            if (value) {
              onSubmit(value);
            }
          }}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Submit Proof"
          )}
        </Button>
      </div>
    </div>
  );
}

interface ActionsCardProps {
  address: string | undefined;
  deadlinePassed: boolean;
  onChainCommitment: OnChainCommitment | undefined;
  onChainId: bigint;
}

export function ActionsCard({
  onChainId,
  onChainCommitment,
  address,
  deadlinePassed,
}: ActionsCardProps) {
  const submitProof = useSubmitProof();
  const verifySuccess = useVerifySuccess();
  const claimSuccess = useClaimSuccess();
  const claimPenalty = useClaimPenalty();
  const markFailed = useMarkFailed();

  const status = onChainCommitment?.status;
  const isUser =
    address?.toLowerCase() === onChainCommitment?.user?.toLowerCase();
  const isVerifier =
    address?.toLowerCase() === onChainCommitment?.verifier?.toLowerCase();
  const isPenaltyReceiver =
    address?.toLowerCase() ===
    onChainCommitment?.penaltyReceiver?.toLowerCase();
  const isActive = status === COMMITMENT_STATUS.ACTIVE;
  const isSucceeded = status === COMMITMENT_STATUS.SUCCEEDED;
  const isFailed = status === COMMITMENT_STATUS.FAILED;

  const showUserProof = isUser && isActive && !deadlinePassed;
  const showVerifier = isVerifier && isActive && !deadlinePassed;
  const showClaimSuccess = isUser && isSucceeded;
  const showClaimPenalty = isPenaltyReceiver && isFailed;
  const showMarkFailed = isActive && deadlinePassed;

  const hasAnyAction =
    showUserProof ||
    showVerifier ||
    showClaimSuccess ||
    showClaimPenalty ||
    showMarkFailed;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{hasAnyAction ? "Actions" : "Debug Actions"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showUserProof && (
          <ProofSubmitButton
            isPending={submitProof.isPending || submitProof.isConfirming}
            onSubmit={(uri) => submitProof.submitProof(onChainId, uri)}
          />
        )}
        {showVerifier && (
          <ActionButton
            buttonText="Verify Success"
            description="Mark this commitment as successful."
            isPending={verifySuccess.isPending || verifySuccess.isConfirming}
            label="Verify Success"
            onClick={() => verifySuccess.verifySuccess(onChainId)}
          />
        )}
        {showClaimSuccess && (
          <ActionButton
            buttonText="Claim Success"
            description="The verifier confirmed your success!"
            isPending={claimSuccess.isPending || claimSuccess.isConfirming}
            label="Claim Your Stake"
            onClick={() => claimSuccess.claimSuccess(onChainId)}
          />
        )}
        {showClaimPenalty && (
          <ActionButton
            buttonText="Claim Penalty"
            description="The commitment failed."
            isPending={claimPenalty.isPending || claimPenalty.isConfirming}
            label="Claim Penalty"
            onClick={() => claimPenalty.claimPenalty(onChainId)}
            variant="destructive"
          />
        )}
        {showMarkFailed && (
          <ActionButton
            buttonText="Mark Failed"
            description="The deadline has passed."
            isPending={markFailed.isPending || markFailed.isConfirming}
            label="Mark as Failed"
            onClick={() => markFailed.markFailed(onChainId)}
            variant="destructive"
          />
        )}

        {/* DEBUG BUTTONS */}
        <div className="mt-4 border-t pt-4">
          <Label className="text-destructive">⚠️ Debug Actions</Label>
          <p className="mb-3 text-muted-foreground text-xs">
            These bypass normal flow conditions - for testing only
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              onClick={() => {
                toast.info("Submitting debug proof...");
                submitProof.submitProof(onChainId, "ipfs://debug/proof");
              }}
              size="sm"
              variant="outline"
            >
              Debug: Submit Proof
            </Button>
            <Button
              onClick={() => {
                toast.info("Marking as debug success...");
                verifySuccess.verifySuccess(onChainId);
              }}
              size="sm"
              variant="outline"
            >
              Debug: Mark Success
            </Button>
            <Button
              onClick={() => {
                toast.info("Marking as debug failed...");
                markFailed.markFailed(onChainId);
              }}
              size="sm"
              variant="destructive"
            >
              Debug: Mark Failed
            </Button>
            <Button
              onClick={() => {
                toast.info("Claiming penalty...");
                claimPenalty.claimPenalty(onChainId);
              }}
              size="sm"
              variant="destructive"
            >
              Debug: Claim Penalty
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
