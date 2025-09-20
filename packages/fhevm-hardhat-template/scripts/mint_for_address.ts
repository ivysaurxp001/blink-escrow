import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Địa chỉ token từ addresses.json
  const MOCK_USDC_ADDRESS = "0xBf94a31cf41be94810B543296036eE698CCF0d1F"; // Update với address mới nhất
  const MOCK_DAI_ADDRESS = "0x8190e817d4e041026F2F32304006aF6dB1873421";   // Update với address mới nhất
  
  // Địa chỉ account cần mint (từ command line argument)
  const targetAddress = process.argv[2];
  
  if (!targetAddress) {
    console.error("Usage: npx hardhat run scripts/mint_for_address.ts --network sepolia <target_address>");
    console.error("Example: npx hardhat run scripts/mint_for_address.ts --network sepolia 0x1234...");
    process.exit(1);
  }

  console.log("Target address:", targetAddress);
  console.log("MockUSDC address:", MOCK_USDC_ADDRESS);
  console.log("MockDAI address:", MOCK_DAI_ADDRESS);

  // Lấy contract instances
  const MockToken = await ethers.getContractFactory("MockToken");
  const usdc = MockToken.attach(MOCK_USDC_ADDRESS);
  const dai = MockToken.attach(MOCK_DAI_ADDRESS);

  // Mint 10,000 MockUSDC
  console.log("Minting 10,000 MockUSDC...");
  await usdc.mint(targetAddress, ethers.parseUnits("10000", 6));
  console.log("✅ Minted 10,000 MockUSDC to", targetAddress);

  // Mint 10,000 MockDAI
  console.log("Minting 10,000 MockDAI...");
  await dai.mint(targetAddress, ethers.parseUnits("10000", 18));
  console.log("✅ Minted 10,000 MockDAI to", targetAddress);

  console.log("\n=== Token Balances ===");
  const usdcBalance = await usdc.balanceOf(targetAddress);
  const daiBalance = await dai.balanceOf(targetAddress);
  
  console.log("MockUSDC balance:", ethers.formatUnits(usdcBalance, 6));
  console.log("MockDAI balance:", ethers.formatUnits(daiBalance, 18));
  
  console.log("\n🎉 Minting completed successfully!");
  console.log("The target address now has tokens to test the blind escrow workflow.");
}

main().catch((err) => {
  console.error("❌ Minting failed:", err);
  process.exit(1);
});
