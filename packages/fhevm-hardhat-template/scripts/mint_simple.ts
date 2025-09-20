import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Địa chỉ account cần mint (từ environment variable)
  const targetAddress = process.env.TARGET_ADDRESS;
  
  if (!targetAddress) {
    console.error("Usage: TARGET_ADDRESS=0x1234... npx hardhat run scripts/mint_simple.ts --network sepolia");
    console.error("Example: TARGET_ADDRESS=0xd8FF12Afb233f53666a22373e864c3e23DcF7495 npx hardhat run scripts/mint_simple.ts --network sepolia");
    process.exit(1);
  }

  console.log("Target address:", targetAddress);

  // Tìm MockToken contracts đã deploy
  // Có thể cần update addresses này sau mỗi lần deploy
  const MOCK_USDC_ADDRESS = "0xBf94a31cf41be94810B543296036eE698CCF0d1F";
  const MOCK_DAI_ADDRESS = "0x8190e817d4e041026F2F32304006aF6dB1873421";

  try {
    // Lấy contract instances
    const MockToken = await ethers.getContractFactory("MockToken");
    const usdc = MockToken.attach(MOCK_USDC_ADDRESS);
    const dai = MockToken.attach(MOCK_DAI_ADDRESS);

    // Mint 10,000 MockUSDC
    console.log("Minting 10,000 MockUSDC...");
    const usdcTx = await usdc.mint(targetAddress, ethers.parseUnits("10000", 6));
    await usdcTx.wait();
    console.log("✅ Minted 10,000 MockUSDC to", targetAddress);

    // Mint 10,000 MockDAI
    console.log("Minting 10,000 MockDAI...");
    const daiTx = await dai.mint(targetAddress, ethers.parseUnits("10000", 18));
    await daiTx.wait();
    console.log("✅ Minted 10,000 MockDAI to", targetAddress);

    console.log("\n=== Token Balances ===");
    const usdcBalance = await usdc.balanceOf(targetAddress);
    const daiBalance = await dai.balanceOf(targetAddress);
    
    console.log("MockUSDC balance:", ethers.formatUnits(usdcBalance, 6));
    console.log("MockDAI balance:", ethers.formatUnits(daiBalance, 18));
    
    console.log("\n🎉 Minting completed successfully!");
    console.log("The target address now has tokens to test the blind escrow workflow.");
    
  } catch (error) {
    console.error("❌ Error minting tokens:", error);
    console.log("\n💡 Make sure:");
    console.log("1. MockToken contracts are deployed");
    console.log("2. Addresses are correct");
    console.log("3. You have permission to mint");
  }
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
