import { CommitmentCard } from '../../components/CommitmentCard';
import styles from '../page.module.css';

const commitments = [
  {
    id: 1,
    description: 'Préstamo para matrícula universitaria',
    deadline: '2026-04-15',
    amount: 1500,
    status: 'pending' as const,
  },
  {
    id: 2,
    description: 'Microcrédito para laptop',
    deadline: '2026-03-28',
    amount: 850,
    status: 'completed' as const,
  },
  {
    id: 3,
    description: 'Soporte financiero para certificación',
    deadline: '2026-03-10',
    amount: 300,
    status: 'overdue' as const,
  },
];

export default function DashboardPage() {
  return (
    <section className={styles.dashboardContainer}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.description}>Visualiza y monitorea tus compromisos activos.</p>

      <div className={styles.cardGrid}>
        {commitments.map((commitment) => (
          <CommitmentCard
            key={commitment.id}
            description={commitment.description}
            deadline={commitment.deadline}
            amount={commitment.amount}
            status={commitment.status}
          />
        ))}
      </div>
    </section>
  );
}