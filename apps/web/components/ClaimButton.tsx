"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";

import styles from "../app/page.module.css";
import {
  formatStake,
  getCommitment,
  isValidCommitment,
} from "../lib/commitment";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../lib/contract";

type ClaimButtonProps = {
  commitmentId: number | string | bigint;
};

export function ClaimButton({ commitmentId }: ClaimButtonProps) {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { error, isPending, writeContractAsync } = useWriteContract();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const handleClick = async () => {
    if (!isConnected || !publicClient) {
      setFeedback("Connect your wallet to claim.");
      return;
    }

    try {
      setFeedback(null);
      setTransactionHash(null);

      const parsedCommitmentId = BigInt(commitmentId);
      const commitment = await getCommitment(publicClient, parsedCommitmentId);

      if (!isValidCommitment(commitment)) {
        throw new Error("Invalid commitment ID.");
      }

      const amountToReturn = formatStake(commitment.stake);
      const hash = await writeContractAsync({
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "claimSuccess",
        args: [parsedCommitmentId],
      });

      setTransactionHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });

      setFeedback(
        `Success. ${amountToReturn} returned for commitment ${parsedCommitmentId.toString()}.`,
      );
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while claiming.";

      setFeedback(message);
    }
  };

  return (
    <div className={styles.field}>
      <button
        className={styles.buttonPrimary}
        disabled={!isConnected || isPending}
        onClick={handleClick}
        type="button"
      >
        {isPending ? "Claiming..." : "Claim"}
      </button>

      {!isConnected ? (
        <p aria-live="polite" className={styles.description}>
          Connect your wallet to continue.
        </p>
      ) : null}
      {feedback ? (
        <p aria-live="polite" className={styles.description}>
          {feedback}
        </p>
      ) : null}
      {transactionHash ? (
        <p aria-live="polite" className={styles.description}>
          Transaction sent: {transactionHash}
        </p>
      ) : null}
      {error ? (
        <p aria-live="polite" className={styles.description}>
          Error: {error.message}
        </p>
      ) : null}
    </div>
  );
}
