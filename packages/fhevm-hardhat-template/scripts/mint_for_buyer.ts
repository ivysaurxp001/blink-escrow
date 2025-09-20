import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Địa chỉ buyer cần mint token (hardcode để dễ sử dụng)
  const buyerAddress = "0xd8FF12Afb233f53666a22373e864c3e23DcF7495";
  
  console.log("Buyer address:", buyerAddress);

  // MockToken addresses (update sau mỗi lần deploy)
  const MOCK_USDC_ADDRESS = "0xBf94a31cf41be94810B543296036eE698CCF0d1F";
  const MOCK_DAI_ADDRESS = "0x8190e817d4e041026F2F32304006aF6dB1873421";

  try {
    // Lấy contract instances
    const MockToken = await ethers.getContractFactory("MockToken");
    const usdc = MockToken.attach(MOCK_USDC_ADDRESS);
    const dai = MockToken.attach(MOCK_DAI_ADDRESS);

    // Mint 10,000 MockUSDC
    console.log("Minting 10,000 MockUSDC...");
    const usdcTx = await usdc.mint(buyerAddress, ethers.parseUnits("10000", 6));
    await usdcTx.wait();
    console.log("✅ Minted 10,000 MockUSDC to", buyerAddress);

    // Mint 10,000 MockDAI
    console.log("Minting 10,000 MockDAI...");
    const daiTx = await dai.mint(buyerAddress, ethers.parseUnits("10000", 18));
    await daiTx.wait();
    console.log("✅ Minted 10,000 MockDAI to", buyerAddress);

    console.log("\n=== Token Balances ===");
    const usdcBalance = await usdc.balanceOf(buyerAddress);
    const daiBalance = await dai.balanceOf(buyerAddress);
    
    console.log("MockUSDC balance:", ethers.formatUnits(usdcBalance, 6));
    console.log("MockDAI balance:", ethers.formatUnits(daiBalance, 18));
    
    console.log("\n🎉 Minting completed successfully!");
    console.log("The buyer now has tokens to test the blind escrow workflow.");
    
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
