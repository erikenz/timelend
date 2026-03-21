"use client";

import Link from "next/link";

import WalletConnect from "../components/WalletConnect";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>TimeLend</h1>
        <p className={styles.description}>
          Create commitments, submit proof, and claim funds with a simple
          Avalanche Fuji workflow.
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
