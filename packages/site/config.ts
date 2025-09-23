// Configuration for Blind Escrow
export const config = {
  // Chain configuration - Update these values after deployment
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || "11155111", // Sepolia
  BLIND_ESCROW_ADDR: process.env.NEXT_PUBLIC_BLIND_ESCROW_ADDR || "0x768FfD52F7633ba87afbF38efCD6097E0b146f1e", // Deployed on Sepolia
  
  // FHEVM Configuration (CDN-based approach)
  // Uses SepoliaConfig automatically - no additional configuration needed
} as const;
