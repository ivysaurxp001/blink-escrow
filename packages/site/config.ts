// Configuration for Blind Escrow
export const config = {
  // Chain configuration - Update these values after deployment
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || "11155111", // Sepolia
  RELAYER_URL: process.env.NEXT_PUBLIC_RELAYER_URL || "http://localhost:3001",
  BLIND_ESCROW_ADDR: process.env.NEXT_PUBLIC_BLIND_ESCROW_ADDR || "0x768FfD52F7633ba87afbF38efCD6097E0b146f1e", // Deployed on Sepolia
  
  // FHEVM Configuration
  FHEVM_RELAYER_URL: process.env.NEXT_PUBLIC_FHEVM_RELAYER_URL || "http://localhost:3001",
  FHEVM_CHAIN_ID: process.env.NEXT_PUBLIC_FHEVM_CHAIN_ID || "11155111",
} as const;
