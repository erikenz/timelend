"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import WalletConnect from "../../components/WalletConnect";
import { config } from "../../lib/wagmi";

const queryClient = new QueryClient();

export default function TestPage() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <main>
          <h1>Test Wallet</h1>
          <WalletConnect />
        </main>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
