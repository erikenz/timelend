"use client";

import Link from "next/link";

import styles from "../app/page.module.css";

export function Navbar() {
  const handleConnectWallet = () => {
    console.log("Connect Wallet clicked from Navbar");
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.navbarInner}>
        <Link className={styles.brand} href="/">
          TimeLend
        </Link>

        <nav aria-label="Main navigation" className={styles.navLinks}>
          <Link href="/">Home</Link>
          <Link href="/create">Create</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>

        <button
          aria-label="Connect Wallet"
          className={styles.buttonPrimary}
          onClick={handleConnectWallet}
          type="button"
        >
          Connect Wallet
        </button>
      </div>
    </header>
  );
}
