"use client";

import { useState } from "react";
import { decodeEventLog, parseEther } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";

import styles from "../app/page.module.css";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../lib/contract";

type FormValues = {
  description: string;
  deadline: string;
  amount: string;
};

const getDurationSeconds = (deadline: string): bigint => {
  const selectedDate = new Date(`${deadline}T23:59:59`);
  const diffMs = selectedDate.getTime() - Date.now();
  const durationSeconds = Math.ceil(diffMs / 1000);

  if (durationSeconds <= 0) {
    throw new Error("Deadline must be in the future.");
  }

  return BigInt(durationSeconds);
};

export function CreateForm() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { error, isPending, writeContractAsync } = useWriteContract();
  const [formValues, setFormValues] = useState<FormValues>({
    description: "",
    deadline: "",
    amount: "",
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const minDate = new Date().toISOString().split("T")[0];

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormValues((previousValues) => ({
      ...previousValues,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isConnected || !address || !publicClient) {
      setFeedback("Connect your wallet to create a commitment.");
      return;
    }

    try {
      setFeedback(null);
      setTransactionHash(null);

      const description = formValues.description.trim();
      const durationSeconds = getDurationSeconds(formValues.deadline);
      const value = parseEther(formValues.amount);

      const hash = await writeContractAsync({
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "createCommitment",
        args: [durationSeconds, address, address, description],
        value,
      });

      setTransactionHash(hash);
      setFeedback("Transaction sent. Waiting for confirmation...");

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const creationLog = receipt.logs.find((log) => {
        try {
          const decodedLog = decodeEventLog({
            abi: CONTRACT_ABI,
            data: log.data,
            topics: log.topics,
          });

          return decodedLog.eventName === "CommitmentCreated";
        } catch {
          return false;
        }
      });

      if (!creationLog) {
        throw new Error("Commitment created, but no commitment ID was found.");
      }

      const decodedLog = decodeEventLog({
        abi: CONTRACT_ABI,
        data: creationLog.data,
        topics: creationLog.topics,
      });
      const commitmentId = decodedLog.args.commitmentId;

      setFeedback(`Success. Commitment ID: ${commitmentId?.toString()}.`);
      setFormValues({
        description: "",
        deadline: "",
        amount: "",
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while creating the commitment.";

      setFeedback(message);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Description
        </label>
        <input
          className={styles.input}
          disabled={isPending}
          id="description"
          name="description"
          onChange={handleChange}
          placeholder="Ship the dashboard redesign"
          required
          type="text"
          value={formValues.description}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="deadline">
          Deadline
        </label>
        <input
          className={styles.input}
          disabled={isPending}
          id="deadline"
          min={minDate}
          name="deadline"
          onChange={handleChange}
          required
          type="date"
          value={formValues.deadline}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="amount">
          Amount (AVAX)
        </label>
        <input
          className={styles.input}
          disabled={isPending}
          id="amount"
          inputMode="decimal"
          min="0"
          name="amount"
          onChange={handleChange}
          placeholder="0.05"
          required
          step="0.0001"
          type="number"
          value={formValues.amount}
        />
      </div>

      <button
        className={styles.buttonPrimary}
        disabled={!isConnected || isPending}
        type="submit"
      >
        {isPending ? "Creating..." : "Create Commitment"}
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
