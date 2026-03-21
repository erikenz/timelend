import styles from '../app/page.module.css';

type CommitmentCardProps = {
  description: string;
  deadline: string;
  amount: number;
  status: 'pending' | 'completed' | 'overdue';
};

export function CommitmentCard({ description, deadline, amount, status }: CommitmentCardProps) {
  const statusLabels: Record<CommitmentCardProps['status'], string> = {
    pending: 'Pendiente',
    completed: 'Completado',
    overdue: 'Vencido',
  };

  const statusClassName =
    status === 'pending'
      ? styles.statusPending
      : status === 'completed'
        ? styles.statusCompleted
        : styles.statusOverdue;

  return (
    <article className={styles.card}>
      <h3 className={styles.cardTitle}>{description}</h3>
      <p className={styles.cardMeta}>Deadline: {deadline}</p>
      <p className={styles.cardMeta}>Amount: ${amount.toFixed(2)}</p>
      <p className={styles.cardMeta}>
        Estado:{' '}
        <span className={`${styles.statusBadge} ${statusClassName ?? ''}`}>
          {statusLabels[status]}
        </span>
      </p>
    </article>
  );
}