import { ethers } from "hardhat";

async function main() {
  console.log("🔄 Updating BlindEscrow contract...");
  
  // Get the contract factory
  const BlindEscrow = await ethers.getContractFactory("BlindEscrow");
  
  // Deploy the updated contract
  const blindEscrow = await BlindEscrow.deploy();
  await blindEscrow.waitForDeployment();
  
  const address = await blindEscrow.getAddress();
  console.log("✅ Updated BlindEscrow deployed at:", address);
  
  // Update frontend config
  const fs = require('fs');
  const path = require('path');
  
  const configPath = path.join(__dirname, '..', '..', 'site', 'config.ts');
  const configContent = `export const config = {
  chainId: 11155111, // Sepolia
  relayerUrl: "https://api.fhevm.org",
  blindEscrowAddress: "${address}",
  mockUSDCAddress: "0x81247a6D2bcBe52761a16DdFe8E01c8bEFd76F71",
  mockDAIAddress: "0x5713CC142EEE3Bd4380f2788Cce377a272f4A5c1"
};`;

  fs.writeFileSync(configPath, configContent);
  console.log("✅ Frontend config updated");
  
  console.log("🎉 Contract update complete!");
  console.log("📝 New address:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
