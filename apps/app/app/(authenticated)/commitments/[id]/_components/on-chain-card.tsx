import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Label } from "@repo/design-system/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { formatEther } from "viem";
import { COMMITMENT_STATUS } from "@/lib/contracts";

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

interface OnChainCardProps {
  data: OnChainCommitment | undefined;
  deadline: Date;
}

export function OnChainCard({ data, deadline }: OnChainCardProps) {
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
                <Label className="text-muted-foreground">Status</Label>
                <p className="mt-1">
                  {COMMITMENT_STATUS[data.status] ?? data.status}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="mt-1 font-mono text-sm">
                  {new Date(Number(data.createdAt) * 1000).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Deadline</Label>
                <p className="mt-1 text-sm">
                  {deadlinePassed ? "Passed" : "In Progress"}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">User (Creator)</Label>
              <p className="mt-1 break-all font-mono text-xs">{data.user}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Verifier</Label>
              <p className="mt-1 break-all font-mono text-xs">
                {data.verifier}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Penalty Receiver</Label>
              <p className="mt-1 break-all font-mono text-xs">
                {data.penaltyReceiver}
              </p>
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

export type { OnChainCommitment };

export function extractOnChainCommitment(
  rawOnChainData: unknown
): OnChainCommitment | undefined {
  if (!rawOnChainData || Array.isArray(rawOnChainData)) {
    return undefined;
  }
  return {
    user: (rawOnChainData as { user: string }).user,
    verifier: (rawOnChainData as { verifier: string }).verifier,
    penaltyReceiver: (rawOnChainData as { penaltyReceiver: string })
      .penaltyReceiver,
    stake: (rawOnChainData as { stake: bigint }).stake,
    createdAt: (rawOnChainData as { createdAt: bigint }).createdAt,
    deadline: (rawOnChainData as { deadline: bigint }).deadline,
    status: (rawOnChainData as { status: number }).status,
    taskURI: (rawOnChainData as { taskURI: string }).taskURI,
    proofURI: (rawOnChainData as { proofURI: string }).proofURI,
  };
}
