"use client";

import { useEffect } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { injected } from "wagmi/connectors";

import styles from "../app/page.module.css";

const shortenAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

export default function WalletConnectClient() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const {
    connect,
    error: connectError,
    isPending: isConnecting,
  } = useConnect();
  const { disconnect } = useDisconnect();
  const {
    error: switchError,
    isPending: isSwitching,
    switchChain,
  } = useSwitchChain();
  const isOnFuji = chainId === avalancheFuji.id;

  useEffect(() => {
    if (isConnected && !isOnFuji && switchChain) {
      switchChain({ chainId: avalancheFuji.id });
    }
  }, [isConnected, isOnFuji, switchChain]);

  if (isConnected && address) {
    return (
      <div className={styles.walletPanel}>
        <p className={styles.cardMeta}>Connected: {shortenAddress(address)}</p>
        <p className={styles.cardMeta}>
          Network: {isOnFuji ? "Avalanche Fuji" : "Wrong network"}
        </p>
        {isOnFuji ? null : (
          <button
            className={styles.buttonPrimary}
            disabled={isSwitching}
            onClick={() => switchChain({ chainId: avalancheFuji.id })}
            type="button"
          >
            {isSwitching ? "Switching..." : "Switch To Fuji"}
          </button>
        )}
        <button
          className={styles.buttonSecondary}
          onClick={() => disconnect()}
          type="button"
        >
          Disconnect
        </button>
        {switchError ? (
          <p className={styles.errorText}>{switchError.message}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <button
        className={styles.buttonPrimary}
        disabled={isConnecting}
        onClick={() => connect({ connector: injected() })}
        type="button"
      >
        {isConnecting ? "Connecting To Fuji..." : "Connect Wallet"}
      </button>
      {connectError ? (
        <p className={styles.errorText}>{connectError.message}</p>
      ) : null}
    </div>
  );
}
