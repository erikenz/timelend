'use client';

import Link from 'next/link';

import styles from '../app/page.module.css';

export function Navbar() {
  const handleConnectWallet = () => {
    console.log('Connect Wallet clicked from Navbar');
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.navbarInner}>
        <Link href="/" className={styles.brand}>
          TimeLend
        </Link>

        <nav className={styles.navLinks} aria-label="Main navigation">
          <Link href="/">Home</Link>
          <Link href="/create">Create</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>

        <button
          type="button"
          className={styles.buttonPrimary}
          onClick={handleConnectWallet}
          aria-label="Connect Wallet"
        >
          Connect Wallet
        </button>
      </div>
    </header>
  );
}