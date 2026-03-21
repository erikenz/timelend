"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { ClaimButton } from "../../components/ClaimButton";
import WalletConnect from "../../components/WalletConnect";
import styles from "../page.module.css";

type Commitment = {
  commitmentId: string;
  user: string;
  status: number;
  deadline: string;
  taskURI: string;
};

type Stats = {
  totalCommitments: number;
  active: number;
  completed: number;
  failed: number;
};

const API_BASE_URL = "http://localhost:3001";

const getStatusLabel = (status: number) => {
  if (status === 0) {
    return "Active";
  }

  if (status === 1) {
    return "Completed";
  }

  if (status === 2) {
    return "Failed";
  }

  return "Unknown";
};

const formatDeadline = (deadline: string) => {
  const timestamp = Number(deadline);

  if (Number.isNaN(timestamp)) {
    return deadline;
  }

  return new Date(timestamp * 1000).toLocaleString();
};

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!address) {
      setCommitments([]);
      setStats(null);
      return;
    }

    setIsLoading(true);

    try {
      const [commitmentsResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/commitments/${address}?limit=5`),
        fetch(`${API_BASE_URL}/stats?limit=5`),
      ]);

      const commitmentsData = (await commitmentsResponse.json().catch(() => null)) as
        | { error?: string }
        | Commitment[]
        | null;
      const statsData = (await statsResponse.json().catch(() => null)) as
        | { error?: string }
        | Stats
        | null;

      if (!commitmentsResponse.ok) {
        throw new Error(
          (commitmentsData as { error?: string } | null)?.error ||
            "Failed to load commitments",
        );
      }

      if (!statsResponse.ok) {
        throw new Error(
          (statsData as { error?: string } | null)?.error ||
            "Failed to load stats",
        );
      }

      setCommitments((commitmentsData as Commitment[]) ?? []);
      setStats((statsData as Stats) ?? null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load dashboard";

      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboardData();
  }, [address]);

  const handleSubmitProof = async (commitmentId: string) => {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }

    const proof = window.prompt("Enter proof text");

    if (!proof || proof.trim().length === 0) {
      return;
    }

    setIsSubmittingProof(commitmentId);

    try {
      const response = await fetch(`${API_BASE_URL}/submit-proof`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commitmentId: Number(commitmentId),
          user: address,
          proof: proof.trim(),
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; status?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error || "Failed to submit proof");
      }

      if (data?.status) {
        alert(`Proof result: ${data.status}`);
      }

      await fetchDashboardData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit proof";

      alert(message);
    } finally {
      setIsSubmittingProof(null);
    }
  };

  return (
    <section className={styles.dashboardContainer}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.description}>
        Track your commitments, submit proof, and claim completed ones.
      </p>

      <div className={styles.section}>
        <WalletConnect />
        {isConnected && address ? (
          <p className={styles.description}>Connected wallet: {address}</p>
        ) : (
          <p className={styles.description}>Please connect your wallet</p>
        )}
      </div>

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
            <h2 className={styles.cardTitle}>Completed</h2>
            <p className={styles.cardMeta}>{stats.completed}</p>
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

      {isConnected && !isLoading && commitments.length === 0 ? (
        <p className={styles.description}>No commitments yet</p>
      ) : null}

      <div className={styles.cardGrid}>
        {commitments.map((commitment) => {
          const statusLabel = getStatusLabel(commitment.status);
          const isActive = commitment.status === 0;
          const isCompleted = commitment.status === 1;
          const isFailed = commitment.status === 2;
          const isSubmitting = isSubmittingProof === commitment.commitmentId;

          return (
            <article className={styles.card} key={commitment.commitmentId}>
              <h2 className={styles.cardTitle}>{commitment.taskURI}</h2>
              <p className={styles.cardMeta}>
                Commitment ID: {commitment.commitmentId}
              </p>
              <p className={styles.cardMeta}>
                Deadline: {formatDeadline(commitment.deadline)}
              </p>
              <p className={styles.cardMeta}>Status: {statusLabel}</p>

              {isActive ? (
                <button
                  className={styles.buttonPrimary}
                  disabled={isSubmitting}
                  onClick={() => void handleSubmitProof(commitment.commitmentId)}
                  type="button"
                >
                  {isSubmitting ? "Submitting..." : "Submit Proof"}
                </button>
              ) : null}

              {isCompleted ? (
                <ClaimButton commitmentId={commitment.commitmentId} />
              ) : null}

              {isFailed ? <p className={styles.cardMeta}>Lost</p> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
