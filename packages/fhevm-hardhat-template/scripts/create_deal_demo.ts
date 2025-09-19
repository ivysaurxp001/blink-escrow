import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const buyer = signers[1]; // Sử dụng account thứ 2 làm buyer
  
  console.log("Deployer (Seller):", deployer.address);
  console.log("Buyer:", buyer.address);
  
  // Địa chỉ contract BlindEscrow (cập nhật sau khi deploy)
  const BLIND_ESCROW_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Cập nhật địa chỉ thực tế
  
  // Mock token addresses (cập nhật sau khi deploy mock tokens)
  const MOCK_USDC = "0x..."; // Cập nhật địa chỉ MockUSDC
  const MOCK_DAI = "0x...";  // Cập nhật địa chỉ MockDAI
  
  const escrow = await ethers.getContractAt("BlindEscrow", BLIND_ESCROW_ADDRESS);
  
  // Tạo deal mới (không cần threshold ở đây)
  const assetAmount = ethers.parseUnits("1000", 6); // 1000 USDC (6 decimals)
  
  console.log("Creating deal...");
  const tx = await escrow.createDeal(
    buyer.address,
    MOCK_USDC,
    assetAmount,
    MOCK_DAI
  );
  
  await tx.wait();
  
  const dealId = await escrow.nextDealId();
  console.log("Deal created with ID:", Number(dealId));
  console.log("Asset Amount:", assetAmount.toString(), "raw units");
  console.log("Asset Amount (UI):", "1000 USDC");
  
  // Lấy thông tin deal
  const dealInfo = await escrow.getDealInfo(Number(dealId));
  console.log("Deal Info:", {
    seller: dealInfo.seller,
    buyer: dealInfo.buyer,
    assetToken: dealInfo.assetToken,
    assetAmount: dealInfo.assetAmount.toString(),
    payToken: dealInfo.payToken,
    hasAsk: dealInfo.hasAsk,
    hasBid: dealInfo.hasBid,
    hasThreshold: dealInfo.hasThreshold,
    state: dealInfo.state
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
