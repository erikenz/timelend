import type { Metadata } from "next";
import Link from "next/link";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "Gestiona compromisos de préstamo con una experiencia clara, rápida y accesible.",
};

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>TimeLend</h1>
        <p className={styles.description}>
          Gestiona compromisos de préstamo con una interfaz simple y rápida.
        </p>
        <div className={styles.section}>
          <Link className={styles.buttonPrimary} href="/create">
            Crear compromiso
          </Link>
          <Link className={styles.buttonSecondary} href="/dashboard">
            Ver dashboard
          </Link>
        </div>
      </section>

      <section aria-labelledby="how-it-works" className={styles.infoSection}>
        <h2 className={styles.sectionTitle} id="how-it-works">
          Cómo funciona
        </h2>
        <ul className={styles.infoList}>
          <li>Define tu compromiso con monto y fecha límite.</li>
          <li>Sigue el estado desde tu dashboard en tiempo real.</li>
          <li>Organiza tus pagos con una vista clara y accionable.</li>
        </ul>
      </section>

      <section aria-labelledby="benefits" className={styles.infoSection}>
        <h2 className={styles.sectionTitle} id="benefits">
          Beneficios
        </h2>
        <p className={styles.description}>
          Diseñado para flujos rápidos, con foco en accesibilidad, feedback de
          estados y una base lista para integración con wallet y contratos.
        </p>
      </section>
    </div>
  );
}
