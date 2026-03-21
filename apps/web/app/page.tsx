'use client';

import styles from './page.module.css';
import WalletConnect from '../components/WalletConnect';

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>TimeLend</h1>
        <p className={styles.description}>
          Gestiona compromisos de préstamo con una interfaz simple y rápida.
        </p>
        <div className={styles.section}>
          <WalletConnect />
        </div>
      </section>
    </div>
  );
}