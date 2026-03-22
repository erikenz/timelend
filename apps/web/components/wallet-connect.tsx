import dynamic from "next/dynamic";

import styles from "../app/page.module.css";

const WalletConnectClient = dynamic(() => import("./wallet-connect-client"), {
  loading: () => (
    <div className={styles.section}>
      <button className={styles.buttonPrimary} type="button">
        Connect Wallet
      </button>
    </div>
  ),
  ssr: false,
});

export default function WalletConnect() {
  return <WalletConnectClient />;
}
