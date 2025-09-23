// src/config/wagmi.ts
import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [
    injected({
      shimDisconnect: true,       // giúp disconnect ổn định
      target: 'metaMask',         // ưu tiên MetaMask
    }),
  ],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/09312fc6fc80421299231e18e15d26be'), // fallback RPC
  },
  ssr: true, // dùng app router -> bật ssr
})
