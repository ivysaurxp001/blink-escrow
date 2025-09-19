import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Địa chỉ token (sẽ được cập nhật sau khi deploy)
  const MOCK_USDC_ADDRESS = process.env.MOCK_USDC_ADDRESS || "";
  const MOCK_DAI_ADDRESS = process.env.MOCK_DAI_ADDRESS || "";
  
  if (!MOCK_USDC_ADDRESS || !MOCK_DAI_ADDRESS) {
    console.error("Please set MOCK_USDC_ADDRESS and MOCK_DAI_ADDRESS environment variables");
    process.exit(1);
  }

  // Lấy contract instances
  const MockToken = await ethers.getContractFactory("MockToken");
  const usdc = MockToken.attach(MOCK_USDC_ADDRESS);
  const dai = MockToken.attach(MOCK_DAI_ADDRESS);

  // Địa chỉ account cần mint (có thể thay đổi)
  const targetAddress = process.argv[2] || deployer.address;
  console.log("Target address:", targetAddress);

  // Mint 10,000 MockUSDC
  await usdc.mint(targetAddress, ethers.parseUnits("10000", 6));
  console.log("Minted 10,000 MockUSDC to", targetAddress);

  // Mint 10,000 MockDAI
  await dai.mint(targetAddress, ethers.parseUnits("10000", 18));
  console.log("Minted 10,000 MockDAI to", targetAddress);

  console.log("\n=== Token Balances ===");
  const usdcBalance = await usdc.balanceOf(targetAddress);
  const daiBalance = await dai.balanceOf(targetAddress);
  
  console.log("MockUSDC balance:", ethers.formatUnits(usdcBalance, 6));
  console.log("MockDAI balance:", ethers.formatUnits(daiBalance, 18));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
