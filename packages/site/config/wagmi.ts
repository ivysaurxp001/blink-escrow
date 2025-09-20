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
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'), // fallback RPC
  },
  ssr: true, // dùng app router -> bật ssr
})
