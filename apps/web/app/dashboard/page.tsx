"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { CommitmentCard } from "../../components/commitment-card";
import WalletConnect from "../../components/wallet-connect";
import {
  type ApiCommitment,
  type ApiCommitmentStats,
  getCommitmentStats,
  listCommitments,
  submitProof,
} from "../../lib/api";
import styles from "../page.module.css";

interface ProofSubmissionPayload {
  proof: string;
  proofFile: File | null;
}

const loadDashboardData = async (walletAddress: string) => {
  const [commitmentsData, statsData] = await Promise.all([
    listCommitments(walletAddress),
    getCommitmentStats(walletAddress),
  ]);

  return {
    commitments: commitmentsData,
    stats: statsData,
  };
};

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [commitments, setCommitments] = useState<ApiCommitment[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState<number | null>(
    null
  );
  const [stats, setStats] = useState<ApiCommitmentStats | null>(null);

  const fetchDashboardData = async (walletAddress?: string) => {
    if (!walletAddress) {
      setCommitments([]);
      setErrorMessage(null);
      setFeedbackMessage(null);
      setStats(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { commitments: commitmentsData, stats: statsData } =
        await loadDashboardData(walletAddress);

      setCommitments(commitmentsData);
      setStats(statsData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load dashboard";

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const hydrateDashboard = async () => {
      if (!address) {
        setCommitments([]);
        setErrorMessage(null);
        setFeedbackMessage(null);
        setStats(null);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const { commitments: commitmentsData, stats: statsData } =
          await loadDashboardData(address);

        setCommitments(commitmentsData);
        setStats(statsData);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load dashboard";

        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };

    hydrateDashboard().catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to load dashboard";

      setErrorMessage(message);
    });
  }, [address]);

  const handleSubmitProof = async (
    commitmentId: number,
    payload: ProofSubmissionPayload
  ) => {
    if (!address) {
      throw new Error("Connect your wallet to continue.");
    }

    setErrorMessage(null);
    setFeedbackMessage(null);
    setIsSubmittingProof(commitmentId);

    try {
      const response = await submitProof({
        commitmentId,
        proof: payload.proof,
        proofFile: payload.proofFile,
        walletAddress: address,
      });

      setFeedbackMessage(
        `AI result: ${response.status}. Resolution tx: ${response.txHash}`
      );

      await fetchDashboardData(address);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit proof";

      setErrorMessage(message);
      throw error;
    } finally {
      setIsSubmittingProof(null);
    }
  };

  return (
    <section className={styles.dashboardContainer}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.description}>
        Track your commitments and submit proof for AI verification.
      </p>

      <div className={styles.section}>
        <WalletConnect />
        {isConnected && address ? (
          <p className={styles.description}>Connected wallet: {address}</p>
        ) : (
          <p className={styles.description}>Please connect your wallet</p>
        )}
      </div>

      {isConnected ? (
        <button
          className={styles.buttonSecondary}
          onClick={() => fetchDashboardData()}
          type="button"
        >
          Refresh Dashboard
        </button>
      ) : null}

      {feedbackMessage ? (
        <p className={styles.feedback}>{feedbackMessage}</p>
      ) : null}
      {errorMessage ? <p className={styles.errorText}>{errorMessage}</p> : null}

      {stats ? (
        <div className={styles.cardGrid}>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Total</h2>
            <p className={styles.cardMeta}>{stats.totalCommitments}</p>
          </article>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Active</h2>
            <p className={styles.cardMeta}>{stats.active}</p>
          </article>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Passed</h2>
            <p className={styles.cardMeta}>{stats.passed}</p>
          </article>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Failed</h2>
            <p className={styles.cardMeta}>{stats.failed}</p>
          </article>
        </div>
      ) : null}

      {isConnected && isLoading ? (
        <p className={styles.description}>Loading commitments...</p>
      ) : null}

      {isConnected ? null : (
        <p className={styles.description}>
          Connect a wallet to load your synced commitments.
        </p>
      )}

      {isConnected && !isLoading && commitments.length === 0 ? (
        <p className={styles.description}>
          No commitments yet. Create one first and it will appear here after the
          backend sync.
        </p>
      ) : null}

      <div className={styles.cardGrid}>
        {commitments.map((commitment) => (
          <CommitmentCard
            commitment={commitment}
            isSubmitting={isSubmittingProof === commitment.commitmentId}
            key={commitment.commitmentId}
            onSubmitProof={handleSubmitProof}
          />
        ))}
      </div>
    </section>
  );
}
