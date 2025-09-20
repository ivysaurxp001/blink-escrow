import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying new BlindEscrow contract...");
  
  // Get the contract factory
  const BlindEscrow = await ethers.getContractFactory("BlindEscrow");
  
  // Deploy the contract
  const blindEscrow = await BlindEscrow.deploy();
  await blindEscrow.waitForDeployment();
  
  const address = await blindEscrow.getAddress();
  console.log("✅ New BlindEscrow deployed at:", address);
  
  // Update frontend config
  const fs = require('fs');
  const path = require('path');
  
  const configPath = path.join(__dirname, '..', '..', 'site', 'config.ts');
  const configContent = `// Configuration for Blind Escrow
export const config = {
  // Chain configuration - Update these values after deployment
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || "11155111", // Sepolia
  RELAYER_URL: process.env.NEXT_PUBLIC_RELAYER_URL || "http://localhost:3001",
  BLIND_ESCROW_ADDR: process.env.NEXT_PUBLIC_BLIND_ESCROW_ADDR || "${address}", // Deployed on Sepolia
  
  // FHEVM Configuration
  FHEVM_RELAYER_URL: process.env.NEXT_PUBLIC_FHEVM_RELAYER_URL || "http://localhost:3001",
  FHEVM_CHAIN_ID: process.env.NEXT_PUBLIC_FHEVM_CHAIN_ID || "11155111",
} as const;`;

  fs.writeFileSync(configPath, configContent);
  console.log("✅ Frontend config updated with new address:", address);
  
  console.log("🎉 Deployment complete!");
  console.log("📝 New contract address:", address);
  console.log("🔄 Please refresh your frontend to use the new contract");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
