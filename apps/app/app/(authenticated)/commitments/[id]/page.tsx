"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";
import { useConnection } from "wagmi";
import { Header } from "@/app/(authenticated)/_components/header";
import { COMMITMENT_STATUS } from "@/lib/contracts";
import { useCommitment } from "@/lib/use-contract";
import { api } from "@/trpc/react";
import {
  ActionsCard,
  DetailsCard,
  extractOnChainCommitment,
  OnChainCard,
  StatusBadge,
  VerificationCard,
} from "./_components";

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

  const onChainCommitment = extractOnChainCommitment(rawOnChainData);

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

  const deadline = onChainCommitment?.deadline
    ? new Date(Number(onChainCommitment.deadline) * 1000)
    : dbCommitment.endDate;

  const isActive = onChainCommitment?.status === COMMITMENT_STATUS.ACTIVE;
  const isUser =
    address?.toLowerCase() === onChainCommitment?.user?.toLowerCase();
  const deadlinePassed = new Date() > deadline;
  const canVerify =
    isConnected && onChainId && isUser && isActive && !deadlinePassed;

  return (
    <>
      <Header
        page={dbCommitment.name}
        pages={["Commitments", dbCommitment.name]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <StatusBadge
            completed={dbCommitment.completed}
            paid={dbCommitment.paid}
            status={onChainCommitment?.status}
          />
          <Button asChild variant="outline">
            <Link href="/commitments">Back to List</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DetailsCard commitment={dbCommitment} />
          <OnChainCard data={onChainCommitment} deadline={deadline} />
        </div>

        {canVerify && onChainId && (
          <VerificationCard
            commitmentId={dbCommitment.id}
            onChainId={onChainId}
            taskDescription={dbCommitment.description}
          />
        )}

        {isConnected && onChainId && (
          <ActionsCard
            address={address}
            commitmentId={dbCommitment.id}
            deadlinePassed={deadlinePassed}
            onChainCommitment={onChainCommitment}
            onChainId={onChainId}
          />
        )}
      </div>
    </>
  );
}
