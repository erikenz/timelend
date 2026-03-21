"use client";

import { useEffect } from "react";
import { avalancheFuji } from "wagmi/chains";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { injected } from "wagmi/connectors";

import styles from "../app/page.module.css";

const shortenAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { isPending: isSwitching, switchChain } = useSwitchChain();
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
        {!isOnFuji ? (
          <button
            className={styles.buttonPrimary}
            disabled={isSwitching}
            onClick={() => switchChain({ chainId: avalancheFuji.id })}
            type="button"
          >
            {isSwitching ? "Switching..." : "Switch To Fuji"}
          </button>
        ) : null}
        <button
          className={styles.buttonPrimary}
          onClick={() => disconnect()}
          type="button"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      className={styles.buttonPrimary}
      onClick={() => connect({ connector: injected() })}
      type="button"
    >
      {isConnecting ? "Connecting To Fuji..." : "Connect Wallet"}
    </button>
  );
}
