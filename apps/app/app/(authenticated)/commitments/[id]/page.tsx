"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";
import { formatEther } from "viem";
import { useConnection } from "wagmi";
import { Header } from "@/app/(authenticated)/_components/header";
import { COMMITMENT_STATUS } from "@/lib/contracts";
import {
  useClaimPenalty,
  useClaimSuccess,
  useCommitment,
  useMarkFailed,
  useSubmitProof,
  useVerifySuccess,
} from "@/lib/use-contract";
import { api } from "@/trpc/react";

type BadgeVariant = "default" | "destructive" | "secondary" | "outline";

interface StatusDisplay {
  icon: typeof CheckCircle2;
  label: string;
  variant: BadgeVariant;
}

function getStatusDisplay(
  status: number | undefined,
  paid: boolean,
  completed: boolean
): StatusDisplay {
  if (paid) {
    return { label: "Completed", variant: "secondary", icon: CheckCircle2 };
  }
  if (status === COMMITMENT_STATUS.CLAIMED_BY_USER) {
    return {
      label: "Claimed (Success)",
      variant: "default",
      icon: CheckCircle2,
    };
  }
  if (status === COMMITMENT_STATUS.CLAIMED_BY_PENALTY) {
    return { label: "Penalty Claimed", variant: "destructive", icon: XCircle };
  }
  if (status === COMMITMENT_STATUS.SUCCEEDED) {
    return {
      label: "Success - Claim Stake",
      variant: "default",
      icon: CheckCircle2,
    };
  }
  if (status === COMMITMENT_STATUS.FAILED) {
    return { label: "Failed", variant: "destructive", icon: XCircle };
  }
  if (status === COMMITMENT_STATUS.ACTIVE) {
    return { label: "Active", variant: "outline", icon: Clock };
  }
  if (completed) {
    return { label: "Completed", variant: "secondary", icon: CheckCircle2 };
  }
  return { label: "Pending", variant: "outline", icon: Clock };
}

interface DbCommitment {
  completed: boolean;
  description: string;
  endDate: Date;
  id: string;
  name: string;
  onChainCommitmentId: string | null;
  paid: boolean;
  startDate: Date;
}

interface OnChainCommitment {
  createdAt: bigint;
  deadline: bigint;
  penaltyReceiver: string;
  proofURI: string;
  stake: bigint;
  status: number;
  taskURI: string;
  user: string;
  verifier: string;
}

function DetailsCard({ commitment }: { commitment: DbCommitment }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-muted-foreground">Description</Label>
          <p className="mt-1">{commitment.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Start Date</Label>
            <p className="mt-1">{commitment.startDate.toLocaleDateString()}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">End Date</Label>
            <p className="mt-1">{commitment.endDate.toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OnChainCard({
  data,
  deadline,
}: {
  data: OnChainCommitment | undefined;
  deadline: Date;
}) {
  const deadlinePassed = new Date() > deadline;
  return (
    <Card>
      <CardHeader>
        <CardTitle>On-Chain Status</CardTitle>
        <CardDescription>Real-time contract state</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Stake Amount</Label>
                <p className="mt-1 font-mono">{formatEther(data.stake)} AVAX</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Verdict</Label>
                <p className="mt-1">
                  {deadlinePassed ? "Deadline Passed" : "In Progress"}
                </p>
              </div>
            </div>
            {data.taskURI && (
              <div>
                <Label className="text-muted-foreground">Task URI</Label>
                <p className="mt-1 break-all font-mono text-xs">
                  {data.taskURI}
                </p>
              </div>
            )}
            {data.proofURI && (
              <div>
                <Label className="text-muted-foreground">Proof Submitted</Label>
                <p className="mt-1 break-all font-mono text-xs">
                  {data.proofURI}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span>Not deployed on-chain</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActionButton({
  label,
  description,
  buttonText,
  onClick,
  isPending,
  variant = "default",
}: {
  label: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  isPending: boolean;
  variant?: "default" | "destructive";
}) {
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

function ProofSubmitButton({
  onSubmit,
  isPending,
}: {
  onSubmit: (uri: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>Submit Proof of Completion</Label>
      <p className="text-muted-foreground text-sm">
        Submit proof that you completed your commitment.
      </p>
      <div className="flex gap-2">
        <Input className="flex-1" id="proof-input" placeholder="ipfs://..." />
        <Button
          disabled={isPending}
          onClick={() => {
            const input = document.getElementById(
              "proof-input"
            ) as HTMLInputElement;
            if (input?.value) {
              onSubmit(input.value);
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

function ActionsCard({
  onChainId,
  onChainCommitment,
  address,
  deadlinePassed,
}: {
  onChainId: bigint;
  onChainCommitment: OnChainCommitment | undefined;
  address: string | undefined;
  deadlinePassed: boolean;
}) {
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

  if (
    !(
      showUserProof ||
      showVerifier ||
      showClaimSuccess ||
      showClaimPenalty ||
      showMarkFailed
    )
  ) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
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
      </CardContent>
    </Card>
  );
}

export default function CommitmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { address, isConnected } = useConnection();

  const { data: dbCommitment, isLoading: dbLoading } =
    api.commitments.getById.useQuery({ id });

  const onChainId = dbCommitment?.onChainCommitmentId
    ? BigInt(dbCommitment.onChainCommitmentId)
    : undefined;
  const { data: rawOnChainData } = useCommitment(onChainId ?? 0n);

  const onChainCommitment: OnChainCommitment | undefined =
    rawOnChainData && Array.isArray(rawOnChainData)
      ? {
          user: rawOnChainData[0] as string,
          verifier: rawOnChainData[1] as string,
          penaltyReceiver: rawOnChainData[2] as string,
          stake: rawOnChainData[3] as bigint,
          createdAt: rawOnChainData[4] as bigint,
          deadline: rawOnChainData[5] as bigint,
          status: rawOnChainData[6] as number,
          taskURI: rawOnChainData[7] as string,
          proofURI: rawOnChainData[8] as string,
        }
      : undefined;

  if (dbLoading) {
    return (
      <>
        <Header page="Loading..." pages={["Commitments"]} />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </>
    );
  }

  if (!dbCommitment) {
    notFound();
  }

  const status = onChainCommitment?.status;
  const statusDisplay = getStatusDisplay(
    status,
    dbCommitment.paid,
    dbCommitment.completed
  );
  const StatusIcon = statusDisplay.icon;
  const deadline = onChainCommitment?.deadline
    ? new Date(Number(onChainCommitment.deadline) * 1000)
    : dbCommitment.endDate;
  const deadlinePassed = new Date() > deadline;

  return (
    <>
      <Header
        page={dbCommitment.name}
        pages={["Commitments", dbCommitment.name]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className="h-6 w-6" />
            <Badge variant={statusDisplay.variant}>{statusDisplay.label}</Badge>
          </div>
          <Button asChild variant="outline">
            <Link href="/commitments">Back to List</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DetailsCard commitment={dbCommitment} />
          <OnChainCard data={onChainCommitment} deadline={deadline} />
        </div>

        {isConnected && onChainId && (
          <ActionsCard
            address={address}
            deadlinePassed={deadlinePassed}
            onChainCommitment={onChainCommitment}
            onChainId={onChainId}
          />
        )}
      </div>
    </>
  );
}
