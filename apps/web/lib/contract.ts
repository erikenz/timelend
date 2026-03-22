import {
  TIME_LEND_CHAIN,
  TIME_LEND_CONTRACT_ABI,
  TIME_LEND_CONTRACT_ADDRESS,
} from "@repo/contracts/timelend-contract";

export const CONTRACT_ABI = TIME_LEND_CONTRACT_ABI;

export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.trim() ||
    TIME_LEND_CONTRACT_ADDRESS) as `0x${string}`;

export const CONTRACT_CHAIN = TIME_LEND_CHAIN;

export const getExplorerTransactionUrl = (hash: string) =>
  `${CONTRACT_CHAIN.blockExplorerUrl}/tx/${hash}`;
