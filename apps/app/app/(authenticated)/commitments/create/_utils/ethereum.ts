/**
 * Ethereum helpers used by the Create Commitment flow.
 *
 * Exports:
 * - EthProvider: minimal typed interface for injected providers (e.g., window.ethereum)
 * - getInjectedProvider(): runtime-safe detection & narrowing for injected provider
 * - ensureWalletOnFuji(): attempts to switch / add Avalanche Fuji (43113) to the injected wallet
 * - extractTxHash(): pulls a 0x-prefixed hash from common objects (tx result / hook data)
 * - getId(): safely extract an `id` string from backend results
 *
 * Notes:
 * - This module uses narrow runtime checks and `unknown` to avoid unsafe `any` usage.
 * - The caller may pass a lightweight `toastArg` object; this file does not depend
 *   on any particular toast library type.
 * - Important: ensureWalletOnFuji no longer treats an unknown chain id as "safe".
 *   If `currentChainId` is undefined we will attempt to interact with the injected
 *   provider to ensure the wallet is (or can be switched) to Avalanche Fuji. This
 *   prevents accidental on-chain actions against mainnet or other networks.
 */

import { AVALANCHE_FUJI_CHAIN_ID } from "@/lib/contracts";

export interface EthProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

/**
 * Runtime type guard: does the unknown value look like an injected provider with a request function?
 */
function isProviderLike(v: unknown): v is EthProvider {
  return (
    typeof v === "object" &&
    v !== null &&
    // using index access + typeof check avoids broad `any`
    typeof ((v as Record<string, unknown>).request as unknown) === "function"
  );
}

/**
 * Return the injected provider (window.ethereum) if present and compatible.
 */
export function getInjectedProvider(): EthProvider | undefined {
  // Access globalThis.ethereum safely as unknown then narrow.
  const globalCandidate = globalThis as unknown;
  if (typeof globalCandidate !== "object" || globalCandidate === null) {
    return undefined;
  }

  // Attempt to read the `ethereum` property.
  const eth = (globalCandidate as { ethereum?: unknown }).ethereum;
  if (isProviderLike(eth)) {
    return eth;
  }
  return undefined;
}

/**
 * Attempts to programmatically ensure the user's wallet is on Avalanche Fuji (43113).
 *
 * Behavior:
 * - If `currentChainId` is explicitly equal to Fuji, returns true immediately.
 * - If `currentChainId` is undefined, do NOT assume safety: attempt to interact with the
 *   injected provider to request a network switch / add the Fuji chain. The caller should
 *   not proceed with on-chain actions until this function returns true.
 * - Attempts `wallet_switchEthereumChain`. If that call succeeds, we return false
 *   to indicate a wallet confirmation was requested (caller typically should abort to let user confirm).
 * - If `wallet_switchEthereumChain` throws, we attempt `wallet_addEthereumChain` to add Fuji.
 *   If that call succeeds we also return false (user still needs to switch).
 * - If both fail we return false and surface an appropriate message via `toastArg` and `setSubmitStatus`.
 *
 * Parameters:
 * - currentChainId?: number  -- optional currently known chain id
 * - setSubmitStatus?: (s: string|null) => void -- optional UI status setter
 * - toastArg?: { error?: (m: string) => void; info?: (m: string) => void } -- optional lightweight toast API
 *
 * Returns: Promise<boolean> -- true if no action required (already on Fuji),
 *                              false if caller should abort/await user action or operation failed.
 */
export async function ensureWalletOnFuji(
  currentChainId?: number,
  setSubmitStatus?: (s: string | null) => void,
  toastArg?: { error?: (m: string) => void; info?: (m: string) => void }
): Promise<boolean> {
  // Only skip when we explicitly detect the wallet is already Fuji.
  // If currentChainId is undefined we must attempt to ensure the injected wallet is on Fuji.
  if (currentChainId === AVALANCHE_FUJI_CHAIN_ID) {
    return true;
  }

  const provider = getInjectedProvider();
  if (!provider) {
    toastArg?.error?.(
      "No web3 provider found. Please install a wallet like MetaMask."
    );
    setSubmitStatus?.("No wallet provider");
    return false;
  }

  // Helper to request and surface status messages.
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xA869" }], // 0xA869 === 43113
    });
    // We requested a switch; user must confirm in their wallet. Signal caller to abort/await.
    setSubmitStatus?.(
      "Requested network switch to Avalanche Fuji; please confirm in your wallet"
    );
    toastArg?.info?.(
      "Requested network switch to Avalanche Fuji; please confirm in your wallet"
    );
    return false;
  } catch {
    // If switching failed, attempt to add the chain. We intentionally don't inspect error codes
    // here to avoid brittle assumptions across wallets; adding is the most common next step.
    try {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0xA869",
            chainName: "Avalanche Fuji",
            nativeCurrency: {
              name: "Avalanche",
              symbol: "AVAX",
              decimals: 18,
            },
            rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
            blockExplorerUrls: ["https://testnet.snowtrace.io/"],
          },
        ],
      });
      setSubmitStatus?.(
        "Avalanche Fuji added to wallet; please switch and retry"
      );
      toastArg?.info?.(
        "Avalanche Fuji added to wallet; please switch and retry"
      );
      return false;
    } catch (addErr) {
      // Failed to add chain as well.
      // Log for diagnostics; surface a friendly message to user.
      // eslint-disable-next-line no-console
      console.error("wallet_addEthereumChain failed", addErr);
      toastArg?.error?.(
        "Please switch your wallet to Avalanche Fuji (43113) and try again"
      );
      setSubmitStatus?.("Wrong network");
      return false;
    }
  }
}

/**
 * Extract a transaction hash from common shapes.
 *
 * Looks for `.hash` or `.transactionHash` properties on provided candidate objects.
 * Returns the first string that starts with '0x', otherwise undefined.
 */
export function extractTxHash(
  ...candidates: unknown[]
): `0x${string}` | undefined {
  for (const candidate of candidates) {
    if (typeof candidate !== "object" || candidate === null) {
      continue;
    }
    const rec = candidate as Record<string, unknown>;
    const maybe = rec.hash ?? rec.transactionHash;
    if (typeof maybe === "string" && maybe.startsWith("0x")) {
      return maybe as `0x${string}`;
    }
  }
  return undefined;
}

/**
 * Safely extract an `id` string from an unknown backend result.
 * Accepts common shapes where `id` may be present (case-sensitive common key 'id').
 */
export function getId(v: unknown): string | undefined {
  if (typeof v !== "object" || v === null) {
    return undefined;
  }
  const rec = v as Record<string, unknown>;
  const idCandidate = rec.id;
  return typeof idCandidate === "string" ? idCandidate : undefined;
}
