"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";

import styles from "../app/page.module.css";
import { getCommitment, isValidCommitment } from "../lib/commitment";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../lib/contract";

type VerifyPanelProps = {
  initialCommitmentId?: number;
};

export function VerifyPanel({ initialCommitmentId }: VerifyPanelProps) {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { error, isPending, writeContractAsync } = useWriteContract();
  const [commitmentId, setCommitmentId] = useState(
    initialCommitmentId?.toString() ?? "",
  );
  const [result, setResult] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isConnected || !publicClient) {
      setResult("Connect your wallet to verify.");
      return;
    }

    try {
      setResult(null);
      setTransactionHash(null);

      const parsedCommitmentId = BigInt(commitmentId);
      const commitment = await getCommitment(publicClient, parsedCommitmentId);

      if (!isValidCommitment(commitment)) {
        throw new Error("Invalid commitment ID.");
      }

      const hash = await writeContractAsync({
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "verifySuccess",
        args: [parsedCommitmentId],
      });

      setTransactionHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });

      setResult(`PASS - commitment ${parsedCommitmentId.toString()} verified`);
    } catch (verifyError) {
      const message =
        verifyError instanceof Error
          ? verifyError.message
          : "Something went wrong while verifying.";

      setResult(`Error: ${message}`);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="verifyCommitmentId">
          Commitment ID
        </label>
        <input
          className={styles.input}
          disabled={isPending}
          id="verifyCommitmentId"
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

      <button
        className={styles.buttonPrimary}
        disabled={!isConnected || isPending}
        type="submit"
      >
        {isPending ? "Verifying..." : "Verify"}
      </button>

      {!isConnected ? (
        <p aria-live="polite" className={styles.description}>
          Connect your wallet to continue.
        </p>
      ) : null}
      {transactionHash ? (
        <p aria-live="polite" className={styles.description}>
          Transaction sent: {transactionHash}
        </p>
      ) : null}
      {result ? (
        <p aria-live="polite" className={styles.description}>
          {result}
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
