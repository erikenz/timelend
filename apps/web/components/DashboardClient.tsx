"use client";

import { type JSX, useCallback, useEffect, useMemo, useState } from "react";
import styles from "../app/page.module.css";
import type { Commitment, CommitmentStatus } from "../lib/commitments";
import { CommitmentCard } from "./CommitmentCard";

type SortMode = "deadline-asc" | "deadline-desc";

const fetchCommitments = async (): Promise<Commitment[]> => {
  const response = await fetch("/api/commitments", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("No se pudieron cargar los compromisos.");
  }

  return (await response.json()) as Commitment[];
};

export function DashboardClient(): JSX.Element {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | CommitmentStatus>(
    "all"
  );
  const [sortMode, setSortMode] = useState<SortMode>("deadline-asc");

  const loadCommitments = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const nextCommitments = await fetchCommitments();
      setCommitments(nextCommitments);
    } catch {
      setLoadError("No pudimos cargar tus compromisos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommitments().catch(() => {
      setLoadError("No pudimos cargar tus compromisos.");
      setIsLoading(false);
    });
  }, [loadCommitments]);

  const visibleCommitments = useMemo(() => {
    const filteredCommitments =
      statusFilter === "all"
        ? commitments
        : commitments.filter(
            (commitment) => commitment.status === statusFilter
          );

    const sortedCommitments = [...filteredCommitments];

    sortedCommitments.sort((firstCommitment, secondCommitment) => {
      if (sortMode === "deadline-desc") {
        return secondCommitment.deadline.localeCompare(
          firstCommitment.deadline
        );
      }

      return firstCommitment.deadline.localeCompare(secondCommitment.deadline);
    });

    return sortedCommitments;
  }, [commitments, statusFilter, sortMode]);

  if (isLoading) {
    return (
      <div className={styles.cardGrid}>
        {["skeleton-1", "skeleton-2", "skeleton-3"].map((skeletonId) => (
          <article
            className={`${styles.card} ${styles.skeletonCard}`}
            key={skeletonId}
          >
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
          </article>
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.emptyState}>
        <p>{loadError}</p>
        <button
          className={styles.buttonPrimary}
          onClick={() => {
            loadCommitments().catch(() => {
              setLoadError("No pudimos cargar tus compromisos.");
            });
          }}
          type="button"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.toolbar}>
        <label className={styles.field} htmlFor="status-filter">
          <span className={styles.label}>Estado</span>
          <select
            className={styles.input}
            id="status-filter"
            onChange={(event) => {
              setStatusFilter(event.target.value as "all" | CommitmentStatus);
            }}
            value={statusFilter}
          >
            <option value="all">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="completed">Completado</option>
            <option value="overdue">Vencido</option>
          </select>
        </label>

        <label className={styles.field} htmlFor="sort-mode">
          <span className={styles.label}>Orden</span>
          <select
            className={styles.input}
            id="sort-mode"
            onChange={(event) => {
              setSortMode(event.target.value as SortMode);
            }}
            value={sortMode}
          >
            <option value="deadline-asc">Fecha límite (más próxima)</option>
            <option value="deadline-desc">Fecha límite (más lejana)</option>
          </select>
        </label>
      </div>

      {visibleCommitments.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Aún no tienes compromisos.</p>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {visibleCommitments.map((commitment) => (
            <CommitmentCard
              amount={commitment.amount}
              deadline={commitment.deadline}
              description={commitment.description}
              key={commitment.id}
              status={commitment.status}
            />
          ))}
        </div>
      )}
    </>
  );
}
