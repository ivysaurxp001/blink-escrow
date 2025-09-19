// Configuration for Blind Escrow
export const config = {
  // Chain configuration - Update these values after deployment
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || "11155111", // Sepolia
  RELAYER_URL: process.env.NEXT_PUBLIC_RELAYER_URL || "http://localhost:3001",
  BLIND_ESCROW_ADDR: process.env.NEXT_PUBLIC_BLIND_ESCROW_ADDR || "0xC52E608A289f8954bb022fbB9081A67f55261109", // Deployed on Sepolia
  
  // FHEVM Configuration
  FHEVM_RELAYER_URL: process.env.NEXT_PUBLIC_FHEVM_RELAYER_URL || "http://localhost:3001",
  FHEVM_CHAIN_ID: process.env.NEXT_PUBLIC_FHEVM_CHAIN_ID || "11155111",
} as const;
