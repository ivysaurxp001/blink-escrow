// Configuration for Blind Escrow
export const config = {
  // Chain configuration - Update these values after deployment
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || "11155111", // Sepolia
  RELAYER_URL: process.env.NEXT_PUBLIC_RELAYER_URL || "http://localhost:3001",
  BLIND_ESCROW_ADDR: process.env.NEXT_PUBLIC_BLIND_ESCROW_ADDR || "0xeA620e639975fbBcC87f9c24138F35d851e516b5", // Deployed on Sepolia
  
  // FHEVM Configuration
  FHEVM_RELAYER_URL: process.env.NEXT_PUBLIC_FHEVM_RELAYER_URL || "http://localhost:3001",
  FHEVM_CHAIN_ID: process.env.NEXT_PUBLIC_FHEVM_CHAIN_ID || "11155111",
} as const;
