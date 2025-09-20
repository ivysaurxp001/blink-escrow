import { ethers } from "hardhat";

async function main() {
  console.log("Minting DAI for buyer using deployer wallet...");
  
  // Get the deployer (owner)
  const [deployer] = await ethers.getSigners();
  console.log("Deployer (owner):", deployer.address);
  
  // Token addresses
  const MOCK_DAI_ADDR = "0xFaba8eFb5d502baf7Cd3832e0AF95EF84a496738";
  const BUYER_ADDR = "0xd8FF12Afb233f53666a22373e864c3e23DcF7495";
  
  // Get MockDAI contract
  const MockDAI = await ethers.getContractAt("MockToken", MOCK_DAI_ADDR);
  
  // Check current balance
  const currentBalance = await MockDAI.balanceOf(BUYER_ADDR);
  console.log("Current buyer balance:", currentBalance.toString());
  
  // Mint 1,000,000 DAI (raw units) to buyer = 0.000001 DAI
  const mintAmount = "1000000000000000000000000"; // 1,000,000 * 10^18
  console.log(`Minting ${mintAmount} DAI to buyer ${BUYER_ADDR}...`);
  
  const tx = await MockDAI.mint(BUYER_ADDR, mintAmount);
  await tx.wait();
  
  // Check new balance
  const newBalance = await MockDAI.balanceOf(BUYER_ADDR);
  console.log("New buyer balance:", newBalance.toString());
  
  console.log("✅ Minting completed successfully!");
  console.log("Buyer now has DAI tokens to complete the workflow.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
