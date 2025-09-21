import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying BlindEscrow with OPEN mode support...");

  // Get the deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy MockToken first
  console.log("\n📦 Deploying MockToken...");
  const MockToken = await ethers.getContractFactory("MockToken");
  const mockUSDC = await MockToken.deploy("Mock USDC", "USDC", 6);
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();

  const mockDAI = await MockToken.deploy("Mock DAI", "DAI", 18);
  await mockDAI.waitForDeployment();
  const mockDAIAddress = await mockDAI.getAddress();

  console.log("✅ MockUSDC deployed to:", mockUSDCAddress);
  console.log("✅ MockDAI deployed to:", mockDAIAddress);

  // Deploy BlindEscrow
  console.log("\n📦 Deploying BlindEscrow...");
  const BlindEscrow = await ethers.getContractFactory("BlindEscrow");
  const blindEscrow = await BlindEscrow.deploy();
  await blindEscrow.waitForDeployment();
  const blindEscrowAddress = await blindEscrow.getAddress();

  console.log("✅ BlindEscrow deployed to:", blindEscrowAddress);

  // Mint tokens for testing
  console.log("\n🪙 Minting tokens for testing...");
  const mintAmount = ethers.parseUnits("100000", 6); // 100k USDC
  const mintAmountDAI = ethers.parseUnits("100000", 18); // 100k DAI

  await mockUSDC.mint(deployer.address, mintAmount);
  await mockDAI.mint(deployer.address, mintAmountDAI);

  console.log("✅ Minted 100,000 MockUSDC to deployer");
  console.log("✅ Minted 100,000 MockDAI to deployer");

  // Update addresses.json
  console.log("\n📝 Updating addresses.json...");
  const fs = require('fs');
  const path = require('path');
  
  const addressesPath = path.join(__dirname, '../contracts/addresses.json');
  const addresses = {
    BlindEscrow: blindEscrowAddress,
    MockUSDC: mockUSDCAddress,
    MockDAI: mockDAIAddress,
    deployer: deployer.address,
    network: "sepolia"
  };

  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("✅ Addresses saved to contracts/addresses.json");

  // Generate frontend config
  console.log("\n📝 Generating frontend config...");
  const frontendConfigPath = path.join(__dirname, '../../site/src/config/contracts.ts');
  const frontendConfig = `// Auto-generated contract addresses
export const BLIND_ESCROW_ADDR = "${blindEscrowAddress}" as const;
export const MOCK_USDC_ADDR = "${mockUSDCAddress}" as const;
export const MOCK_DAI_ADDR = "${mockDAIAddress}" as const;
`;

  fs.writeFileSync(frontendConfigPath, frontendConfig);
  console.log("✅ Frontend config generated");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log(`BlindEscrow: ${blindEscrowAddress}`);
  console.log(`MockUSDC: ${mockUSDCAddress}`);
  console.log(`MockDAI: ${mockDAIAddress}`);
  console.log(`Deployer: ${deployer.address}`);

  console.log("\n🔧 Next Steps:");
  console.log("1. Update your frontend to use the new contract addresses");
  console.log("2. Test creating OPEN deals");
  console.log("3. Test the marketplace functionality");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

