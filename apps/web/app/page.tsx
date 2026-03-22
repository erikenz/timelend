"use client";

import Link from "next/link";

import WalletConnect from "../components/wallet-connect";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>TimeLend</h1>
        <p className={styles.description}>
          Commit funds to a deadline, submit proof, and let the backend resolve
          the result on-chain.
        </p>

        <div className={styles.section}>
          <WalletConnect />
          <div className={styles.walletPanel}>
            <Link className={styles.buttonPrimary} href="/create">
              Create Commitment
            </Link>
            <Link className={styles.buttonPrimary} href="/dashboard">
              Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
