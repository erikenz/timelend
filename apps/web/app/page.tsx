"use client";

import styles from "./page.module.css";

export default function Home() {
  const handleConnectWallet = () => {
    console.log("Connect Wallet clicked from Home");
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>TimeLend</h1>
        <p className={styles.description}>
          Gestiona compromisos de préstamo con una interfaz simple y rápida.
        </p>
        <div className={styles.section}>
          <button
            className={styles.buttonPrimary}
            onClick={handleConnectWallet}
            type="button"
          >
            Connect Wallet
          </button>
        </div>
      </section>
    </div>
  );
}
