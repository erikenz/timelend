import styles from "../app/page.module.css";

interface CommitmentCardProps {
  amount: number;
  deadline: string;
  description: string;
  status: "pending" | "completed" | "overdue";
}

export function CommitmentCard({
  description,
  deadline,
  amount,
  status,
}: CommitmentCardProps) {
  const formattedAmount = new Intl.NumberFormat("es-ES", {
    currency: "EUR",
    style: "currency",
  }).format(amount);
  const formattedDeadline = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
  }).format(new Date(`${deadline}T00:00:00`));

  const statusLabels: Record<CommitmentCardProps["status"], string> = {
    pending: "Pendiente",
    completed: "Completado",
    overdue: "Vencido",
  };

  const statusClassNameMap: Record<CommitmentCardProps["status"], string> = {
    pending: styles.statusPending,
    completed: styles.statusCompleted,
    overdue: styles.statusOverdue,
  };
  const statusClassName = statusClassNameMap[status];

  return (
    <article className={styles.card}>
      <h3 className={styles.cardTitle}>{description}</h3>
      <p className={styles.cardMeta}>Deadline: {formattedDeadline}</p>
      <p className={styles.cardMeta}>Amount: {formattedAmount}</p>
      <p className={styles.cardMeta}>
        Estado:{" "}
        <span className={`${styles.statusBadge} ${statusClassName ?? ""}`}>
          {statusLabels[status]}
        </span>
      </p>
    </article>
  );
}
