"use client";

import Link from "next/link";

import styles from "../app/page.module.css";
import WalletConnect from "./WalletConnect";

export function Navbar() {
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

        <WalletConnect />
      </div>
    </header>
  );
}
