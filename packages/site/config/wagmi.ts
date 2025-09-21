// config/wagmi.ts
import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [
    metaMask(), // Use metaMask connector instead of injected
    injected(), // Fallback to injected
  ],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/ac7264316be146b0ae56f2222773a352', {
      timeout: 10000, // 10 second timeout
      retryCount: 3, // Retry 3 times
    }),
  },
  ssr: true, // dùng app router -> bật ssr
})
