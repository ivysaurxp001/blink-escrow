import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0]; // Sử dụng account đầu tiên (từ private key)
  console.log("Deployer:", deployer.address);
  console.log("Network:", await deployer.provider.getNetwork());
  console.log("Total signers:", signers.length);
  
  // Debug: in tất cả signers
  for (let i = 0; i < signers.length; i++) {
    console.log(`Signer ${i}:`, signers[i].address);
  }

  const BlindEscrow = await ethers.getContractFactory("BlindEscrow");
  const escrow = await BlindEscrow.deploy(); // Constructor không nhận tham số
  await escrow.waitForDeployment();

  console.log("BlindEscrow deployed at:", await escrow.getAddress());
  console.log("Owner:", await escrow.owner());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

