import { createConfig, http } from 'wagmi';
import { avalancheFuji } from 'wagmi/chains';

export const config = createConfig({
  chains: [avalancheFuji],
  transports: {
    [avalancheFuji.id]: http(),
  },
});