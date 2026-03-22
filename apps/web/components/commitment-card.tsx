"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { formatEther } from "viem";

import styles from "../app/page.module.css";
import type { ApiCommitment } from "../lib/api";
import { getProofFileUrl } from "../lib/api";
import { getExplorerTransactionUrl } from "../lib/contract";

interface CommitmentCardProps {
  commitment: ApiCommitment;
  isSubmitting: boolean;
  onSubmitProof: (
    commitmentId: number,
    payload: {
      proof: string;
      proofFile: File | null;
    }
  ) => Promise<void>;
}

const SUPPORTED_FILE_ACCEPT = ".png,.jpg,.jpeg,.webp,.pdf,.txt,.md,.csv,.json";

const formatDateTime = (value: string) => {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return value;
  }

  return new Date(timestamp).toLocaleString();
};

const formatFileSize = (value: number | null) => {
  if (!value) {
    return null;
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const shortenHash = (value: string) =>
  `${value.slice(0, 10)}...${value.slice(-8)}`;

export function CommitmentCard({
  commitment,
  isSubmitting,
  onSubmitProof,
}: CommitmentCardProps) {
  const [proof, setProof] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedProof = proof.trim();

    if (!(trimmedProof || proofFile)) {
      return;
    }

    await onSubmitProof(commitment.commitmentId, {
      proof: trimmedProof,
      proofFile,
    });
    setProof("");
    setProofFile(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const [nextFile] = Array.from(event.target.files ?? []);

    setProofFile(nextFile ?? null);
  };

  let statusClassName = styles.statusActive;

  if (commitment.status === "passed") {
    statusClassName = styles.statusPassed;
  }

  if (commitment.status === "failed") {
    statusClassName = styles.statusFailed;
  }

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{commitment.taskDescription}</h2>
        <span className={`${styles.statusBadge} ${statusClassName}`}>
          {commitment.status.toUpperCase()}
        </span>
      </div>

      <p className={styles.cardMeta}>
        Commitment ID: {commitment.commitmentId}
      </p>
      <p className={styles.cardMeta}>
        Stake: {formatEther(BigInt(commitment.stakeWei))} AVAX
      </p>
      <p className={styles.cardMeta}>
        Created: {formatDateTime(commitment.createdAt)}
      </p>
      <p className={styles.cardMeta}>
        Deadline: {formatDateTime(commitment.deadlineAt)}
      </p>

      {commitment.contractTxHash ? (
        <p className={styles.cardMeta}>
          Create tx:{" "}
          <Link
            href={getExplorerTransactionUrl(commitment.contractTxHash)}
            rel="noopener noreferrer"
            target="_blank"
          >
            {shortenHash(commitment.contractTxHash)}
          </Link>
        </p>
      ) : null}

      {commitment.status === "active" ? (
        <form className={styles.cardActions} onSubmit={handleSubmit}>
          <label
            className={styles.label}
            htmlFor={`proof-${commitment.commitmentId}`}
          >
            Proof Note
          </label>
          <textarea
            className={styles.textarea}
            id={`proof-${commitment.commitmentId}`}
            onChange={(event) => setProof(event.target.value)}
            placeholder="Explain what you completed and add context for the AI."
            value={proof}
          />

          <label
            className={styles.label}
            htmlFor={`proof-file-${commitment.commitmentId}`}
          >
            Proof File
          </label>
          <input
            accept={SUPPORTED_FILE_ACCEPT}
            className={styles.input}
            id={`proof-file-${commitment.commitmentId}`}
            onChange={handleFileChange}
            type="file"
          />

          {proofFile ? (
            <p className={styles.cardMeta}>
              Selected file: {proofFile.name} ({formatFileSize(proofFile.size)})
            </p>
          ) : null}

          <button
            className={styles.buttonPrimary}
            disabled={isSubmitting || !(proof.trim() || proofFile)}
            type="submit"
          >
            {isSubmitting ? "Verifying..." : "Submit Proof"}
          </button>
        </form>
      ) : null}

      {commitment.proof ? (
        <p className={styles.cardMeta}>Proof note: {commitment.proof}</p>
      ) : null}

      {commitment.proofFileName ? (
        <p className={styles.cardMeta}>
          Proof file:{" "}
          <Link
            href={getProofFileUrl(commitment.commitmentId)}
            rel="noopener noreferrer"
            target="_blank"
          >
            {commitment.proofFileName}
          </Link>
          {commitment.proofFileSizeBytes
            ? ` (${formatFileSize(commitment.proofFileSizeBytes)})`
            : ""}
        </p>
      ) : null}

      {commitment.aiResult ? (
        <p className={styles.cardMeta}>AI result: {commitment.aiResult}</p>
      ) : null}

      {commitment.resolutionTxHash ? (
        <p className={styles.cardMeta}>
          Resolution tx:{" "}
          <Link
            href={getExplorerTransactionUrl(commitment.resolutionTxHash)}
            rel="noopener noreferrer"
            target="_blank"
          >
            {shortenHash(commitment.resolutionTxHash)}
          </Link>
        </p>
      ) : null}
    </article>
  );
}
