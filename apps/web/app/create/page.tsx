"use client";

import { useAccount } from "wagmi";

import { CreateForm } from "../../components/create-form";
import WalletConnect from "../../components/wallet-connect";
import styles from "../page.module.css";

export default function CreatePage() {
  const { address, isConnected } = useAccount();

  return (
    <section className={styles.createContainer}>
      <h1 className={styles.title}>Create Commitment</h1>
      <p className={styles.description}>
        Lock your AVAX on-chain, then sync the commitment into the backend so it
        can be verified later.
      </p>

      <div className={styles.section}>
        <WalletConnect />
        {isConnected && address ? (
          <p className={styles.description}>Connected wallet: {address}</p>
        ) : (
          <p className={styles.description}>Please connect your wallet</p>
        )}
      </div>

      {isConnected ? <CreateForm /> : null}
    </section>
  );
}
