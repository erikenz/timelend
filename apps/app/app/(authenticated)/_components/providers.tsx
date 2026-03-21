"use client";

import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>;
};
