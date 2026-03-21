import type { Metadata } from "next";
import { DashboardClient } from "../../components/DashboardClient";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Monitorea tus compromisos y su estado en un solo lugar.",
};

export default function DashboardPage() {
  return (
    <section className={styles.dashboardContainer}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.description}>
        Visualiza y monitorea tus compromisos activos.
      </p>
      <DashboardClient />
    </section>
  );
}
