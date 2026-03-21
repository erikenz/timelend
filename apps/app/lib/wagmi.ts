import { createConfig, http } from "wagmi";
import { avalanche, avalancheFuji } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [avalancheFuji, avalanche],
  connectors: [injected()],
  transports: {
    [avalancheFuji.id]: http(),
    [avalanche.id]: http(),
  },
});
