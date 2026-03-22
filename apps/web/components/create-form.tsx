"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { decodeEventLog, parseEther } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";

import styles from "../app/page.module.css";
import { syncCommitment } from "../lib/api";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  getExplorerTransactionUrl,
} from "../lib/contract";

interface FormValues {
  amount: string;
  deadline: string;
  description: string;
}

interface PendingSyncCommitment {
  commitmentId: number;
  txHash: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const MIN_DESCRIPTION_LENGTH = 5;

const getDurationSeconds = (deadline: string): bigint => {
  const selectedDate = new Date(`${deadline}T23:59:59`);
  const diffMs = selectedDate.getTime() - Date.now();
  const durationSeconds = Math.ceil(diffMs / 1000);

  if (durationSeconds <= 0) {
    throw new Error("Deadline must be in the future.");
  }

  return BigInt(durationSeconds);
};

const validateForm = (formValues: FormValues): FormErrors => {
  const errors: FormErrors = {};

  if (formValues.description.trim().length < MIN_DESCRIPTION_LENGTH) {
    errors.description = "Description must be at least 5 characters long.";
  }

  if (!formValues.deadline) {
    errors.deadline = "Select a valid deadline.";
  }

  const numericAmount = Number(formValues.amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    errors.amount = "Amount must be greater than zero.";
  }

  return errors;
};

export function CreateForm() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { error, isPending, writeContractAsync } = useWriteContract();
  const [errors, setErrors] = useState<FormErrors>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<FormValues>({
    amount: "",
    deadline: "",
    description: "",
  });
  const [pendingSyncCommitment, setPendingSyncCommitment] =
    useState<PendingSyncCommitment | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const minDate = new Date().toISOString().split("T")[0];

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const fieldName = name as keyof FormValues;

    setFormValues((previousValues) => ({
      ...previousValues,
      [fieldName]: value,
    }));
    setErrors((previousErrors) => ({
      ...previousErrors,
      [fieldName]: undefined,
    }));
  };

  const syncCreatedCommitment = async ({
    commitmentId,
    txHash,
  }: PendingSyncCommitment) => {
    if (!address) {
      throw new Error("Connect your wallet to sync the commitment.");
    }

    await syncCommitment({
      commitmentId,
      txHash,
      walletAddress: address,
    });

    setPendingSyncCommitment(null);
  };

  const handleRetrySync = async () => {
    if (!pendingSyncCommitment) {
      return;
    }

    try {
      setFeedback("Retrying backend sync...");
      await syncCreatedCommitment(pendingSyncCommitment);
      setFeedback(
        `Commitment ${pendingSyncCommitment.commitmentId} synced to the backend.`
      );
    } catch (syncError) {
      const message =
        syncError instanceof Error
          ? syncError.message
          : "The commitment exists on-chain, but backend sync is still failing.";

      setFeedback(message);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(formValues);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!(isConnected && address && publicClient)) {
      setFeedback("Connect your wallet to create a commitment.");
      return;
    }

    try {
      setFeedback(null);
      setPendingSyncCommitment(null);
      setTransactionHash(null);

      const description = formValues.description.trim();
      const durationSeconds = getDurationSeconds(formValues.deadline);
      const value = parseEther(formValues.amount);

      const hash = await writeContractAsync({
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "createCommitment",
        args: [durationSeconds, description],
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

      if (typeof commitmentId !== "bigint") {
        throw new Error("Commitment ID could not be parsed.");
      }

      const syncedCommitment = {
        commitmentId: Number(commitmentId),
        txHash: hash,
      };

      try {
        await syncCreatedCommitment(syncedCommitment);
      } catch (syncError) {
        setPendingSyncCommitment(syncedCommitment);

        const message =
          syncError instanceof Error
            ? syncError.message
            : "The commitment was created on-chain, but backend sync failed.";

        setFeedback(
          `${message} Your funds are already locked on-chain. Do not create it again. Use Retry Sync to import commitment ${commitmentId.toString()} into the dashboard.`
        );

        return;
      }

      setFeedback(
        `Commitment ${commitmentId.toString()} created and synced to the backend.`
      );
      setFormValues({
        amount: "",
        deadline: "",
        description: "",
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
          Task Description
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
        {errors.description ? (
          <p className={styles.errorText}>{errors.description}</p>
        ) : null}
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
        {errors.deadline ? (
          <p className={styles.errorText}>{errors.deadline}</p>
        ) : null}
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
        {errors.amount ? (
          <p className={styles.errorText}>{errors.amount}</p>
        ) : null}
      </div>

      <button
        className={styles.buttonPrimary}
        disabled={!isConnected || isPending}
        type="submit"
      >
        {isPending ? "Creating..." : "Create Commitment"}
      </button>

      {pendingSyncCommitment ? (
        <button
          className={styles.buttonSecondary}
          onClick={handleRetrySync}
          type="button"
        >
          Retry Sync
        </button>
      ) : null}

      {isConnected ? null : (
        <p aria-live="polite" className={styles.description}>
          Connect your wallet to continue.
        </p>
      )}
      {feedback ? (
        <p aria-live="polite" className={styles.feedback}>
          {feedback}
        </p>
      ) : null}
      {transactionHash ? (
        <p aria-live="polite" className={styles.cardMeta}>
          Transaction:{" "}
          <Link
            href={getExplorerTransactionUrl(transactionHash)}
            rel="noopener noreferrer"
            target="_blank"
          >
            {transactionHash}
          </Link>
        </p>
      ) : null}
      {error ? (
        <p aria-live="polite" className={styles.errorText}>
          Error: {error.message}
        </p>
      ) : null}
    </form>
  );
}
