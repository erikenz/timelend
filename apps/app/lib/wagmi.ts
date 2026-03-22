import { createConfig, http } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { env } from "@/env";

/**
 * Client-side wagmi config for demo: only target Avalanche Fuji Testnet.
 * This repo is a demo — remove mainnet references so the app only connects to testnet.
 */
const fujiRpcUrl =
  env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL ??
  "https://api.avax-test.network/ext/bc/C/rpc";

export const wagmiConfig = createConfig({
  chains: [avalancheFuji],
  connectors: [injected()],
  transports: {
    [avalancheFuji.id]: fujiRpcUrl ? http(fujiRpcUrl) : http(),
  },
});
