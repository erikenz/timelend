"use client";

import { Button } from "@repo/design-system/components/ui/button";

interface TestnetBannerProps {
  isOnFuji: boolean;
  onSwitch: () => Promise<void>;
}

export function TestnetBanner({ isOnFuji, onSwitch }: TestnetBannerProps) {
  if (isOnFuji) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-3 text-green-800 text-sm">
        Wallet is on Avalanche Fuji (testnet). You can submit commitments.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          This form only works on the Avalanche Fuji testnet (chain id 43113).
          Please switch your wallet to Fuji to submit commitments.
        </div>
        <Button className="shrink-0" onClick={onSwitch} type="button">
          Switch to Fuji
        </Button>
      </div>
    </div>
  );
}
