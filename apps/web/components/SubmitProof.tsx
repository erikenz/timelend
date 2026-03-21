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

type SubmitProofProps = {
  initialCommitmentId?: number;
};

export function SubmitProof({ initialCommitmentId }: SubmitProofProps) {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { error, isPending, writeContractAsync } = useWriteContract();
  const [commitmentId, setCommitmentId] = useState(
    initialCommitmentId?.toString() ?? "",
  );
  const [proof, setProof] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isConnected || !publicClient) {
      setFeedback("Connect your wallet to submit proof.");
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

      const hash = await writeContractAsync({
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "submitProof",
        args: [parsedCommitmentId, proof.trim()],
      });

      setTransactionHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });

      setFeedback(
        `Success. Proof submitted for commitment ${parsedCommitmentId.toString()} with stake ${formatStake(commitment.stake)}.`,
      );
      setProof("");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while submitting proof.";

      setFeedback(message);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="commitmentId">
          Commitment ID
        </label>
        <input
          className={styles.input}
          disabled={isPending}
          id="commitmentId"
          inputMode="numeric"
          min="0"
          onChange={(event) => setCommitmentId(event.target.value)}
          placeholder="1"
          required
          step="1"
          type="number"
          value={commitmentId}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="proof">
          Proof
        </label>
        <input
          className={styles.input}
          disabled={isPending}
          id="proof"
          onChange={(event) => setProof(event.target.value)}
          placeholder="https://example.com/proof"
          required
          type="text"
          value={proof}
        />
      </div>

      <button
        className={styles.buttonPrimary}
        disabled={!isConnected || isPending}
        type="submit"
      >
        {isPending ? "Submitting..." : "Submit Proof"}
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
    </form>
  );
}
