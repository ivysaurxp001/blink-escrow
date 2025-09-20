import { ethers } from "hardhat";

async function main() {
  console.log("Minting DAI directly to buyer...");
  
  // Get the deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  // Token addresses from frontend config
  const MOCK_DAI_ADDR = "0xFaba8eFb5d502baf7Cd3832e0AF95EF84a496738";
  const BUYER_ADDR = "0xd8FF12Afb233f53666a22373e864c3e23DcF7495";
  
  // Get MockDAI contract
  const MockDAI = await ethers.getContractAt("MockToken", MOCK_DAI_ADDR);
  
  // Check current balance
  const currentBalance = await MockDAI.balanceOf(BUYER_ADDR);
  console.log("Current buyer balance:", currentBalance.toString());
  
  // Mint 10,000 DAI (raw units)
  const mintAmount = "10000";
  console.log(`Minting ${mintAmount} DAI to buyer...`);
  
  const tx = await MockDAI.mint(BUYER_ADDR, mintAmount);
  await tx.wait();
  
  // Check new balance
  const newBalance = await MockDAI.balanceOf(BUYER_ADDR);
  console.log("New buyer balance:", newBalance.toString());
  
  console.log("✅ Minting completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
