"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

import styles from "../app/page.module.css";

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const firstNavLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (pathname.length > 0) {
      setIsMenuOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    firstNavLinkRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const handleWalletClick = async () => {
    if (isConnected) {
      disconnect();
    } else {
      try {
        connect({ connector: injected() });
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    }
  };

  const getWalletLabel = () => {
    if (isPending) {
      return "Conectando...";
    }
    if (isConnected) {
      return `${address?.slice(0, 6)}...${address?.slice(-4)}`;
    }
    return "Conectar";
  };

  const getNavLinkClassName = (href: string) =>
    `${styles.navLink} ${pathname === href ? styles.navLinkActive : ""}`;

  return (
    <header className={styles.navbar}>
      <div className={styles.navbarInner}>
        <Link className={styles.brand} href="/">
          TimeLend
        </Link>

        <button
          aria-controls="main-navigation"
          aria-expanded={isMenuOpen}
          aria-label="Abrir menú de navegación"
          className={styles.navToggle}
          onClick={() => {
            setIsMenuOpen((previousValue) => !previousValue);
          }}
          type="button"
        >
          Menú
        </button>

        <nav
          aria-label="Main navigation"
          className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ""}`}
          id="main-navigation"
        >
          <Link
            className={getNavLinkClassName("/")}
            href="/"
            ref={firstNavLinkRef}
          >
            Home
          </Link>
          <Link className={getNavLinkClassName("/create")} href="/create">
            Create
          </Link>
          <Link className={getNavLinkClassName("/dashboard")} href="/dashboard">
            Dashboard
          </Link>
        </nav>

        <button
          aria-label={isConnected ? "Desconectar wallet" : "Conectar wallet"}
          className={styles.buttonPrimary}
          disabled={isPending}
          onClick={handleWalletClick}
          type="button"
        >
          {getWalletLabel()}
        </button>
      </div>
    </header>
  );
}
