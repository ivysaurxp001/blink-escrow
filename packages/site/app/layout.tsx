'use client';

import '@/polyfills';
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/config/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './globals.css'
import { ReactNode, useState } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient())
  return (
    <html lang="en">
      <body className="text-foreground antialiased">
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={qc}>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}
