'use client'

import WalletConnect from '../../components/WalletConnect'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '../../lib/wagmi'

const queryClient = new QueryClient()

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
  )
}