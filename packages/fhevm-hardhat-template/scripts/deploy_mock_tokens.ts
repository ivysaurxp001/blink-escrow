import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // MockUSDC (6 decimals)
  const MockToken = await ethers.getContractFactory("MockToken");
  const usdc = await MockToken.deploy("MockUSDC", "mUSDC", 6);
  await usdc.waitForDeployment();
  console.log("MockUSDC deployed at:", await usdc.getAddress());

  // MockDAI (18 decimals)
  const dai = await MockToken.deploy("MockDAI", "mDAI", 18);
  await dai.waitForDeployment();
  console.log("MockDAI deployed at:", await dai.getAddress());

  // Mint thêm cho deployer để test
  console.log("\n=== Minting tokens for testing ===");
  
  // Mint thêm 100,000 MockUSDC
  await usdc.mint(deployer.address, ethers.parseUnits("100000", 6));
  console.log("Minted 100,000 MockUSDC to deployer");
  
  // Mint thêm 100,000 MockDAI
  await dai.mint(deployer.address, ethers.parseUnits("100000", 18));
  console.log("Minted 100,000 MockDAI to deployer");

  const usdcAddress = await usdc.getAddress();
  const daiAddress = await dai.getAddress();
  
  console.log("\n=== Token Addresses ===");
  console.log("MockUSDC:", usdcAddress);
  console.log("MockDAI:", daiAddress);
  
  // Tạo file config cho frontend
  const configContent = `// Auto-generated from deploy_mock_tokens.ts
export const MOCK_TOKENS = {
  MOCK_USDC: "${usdcAddress}",
  MOCK_DAI: "${daiAddress}",
} as const;

export const MOCK_USDC_ADDRESS = "${usdcAddress}";
export const MOCK_DAI_ADDRESS = "${daiAddress}";
`;
  
  const configPath = path.join('..', 'site', 'abi', 'MockTokenAddresses.ts');
  writeFileSync(configPath, configContent);
  
  console.log("\n=== Usage Instructions ===");
  console.log("1. Token addresses saved to MockTokenAddresses.ts");
  console.log("2. Use in Blind Escrow as assetToken/payToken");
  console.log("3. Approve tokens before creating deals");
  console.log("4. For other accounts, use mint() function");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
