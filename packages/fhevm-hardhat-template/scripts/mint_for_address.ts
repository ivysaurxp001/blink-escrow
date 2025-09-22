import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Địa chỉ token từ deployment mới nhất
  const MOCK_USDC_ADDRESS = "0x4954c87dC09a479e33561C4E5537296701Ef1733"; // MockUSDC mới
  const MOCK_DAI_ADDRESS = "0xB0c41a92641f64a3c804CDD1c779cec17a253681";   // MockDAI mới
  
  // Địa chỉ account cần mint (từ environment variable hoặc hardcode)
  const targetAddress = process.env.TARGET_ADDRESS || "0x8d30010878d95C7EeF78e543Ee2133db846633b8";
  
  if (!targetAddress) {
    console.error("Usage: TARGET_ADDRESS=0x1234... npx hardhat run scripts/mint_for_address.ts --network sepolia");
    console.error("Example: TARGET_ADDRESS=0xd8FF12Afb233f53666a22373e864c3e23DcF7495 npx hardhat run scripts/mint_for_address.ts --network sepolia");
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
