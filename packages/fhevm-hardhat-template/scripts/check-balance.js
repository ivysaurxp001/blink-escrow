const { ethers } = require("hardhat");

async function main() {
  // Address to check balance for
  const addressToCheck = "0x963a2d0BE2eb5d785C6E73ec904fcE8d65691773"; // Change this!
  
  // Token addresses
  const DAI_ADDRESS = "0x5f3CD01981EFB5C500d20be535C68B980cfFC414"; // Mock DAI
  const USDC_ADDRESS = "0x..."; // Add your USDC address if you have one
  
  console.log(`Checking balances for address: ${addressToCheck}\n`);

  try {
    // Check ETH balance
    const ethBalance = await ethers.provider.getBalance(addressToCheck);
    console.log(`ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

    // Token ABI
    const tokenABI = [
      "function balanceOf(address account) external view returns (uint256)",
      "function decimals() external view returns (uint8)",
      "function symbol() external view returns (string)",
      "function name() external view returns (string)"
    ];

    // Check DAI balance
    if (DAI_ADDRESS !== "0x...") {
      const daiToken = new ethers.Contract(DAI_ADDRESS, tokenABI, ethers.provider);
      
      try {
        const name = await daiToken.name();
        const symbol = await daiToken.symbol();
        const decimals = await daiToken.decimals();
        const balance = await daiToken.balanceOf(addressToCheck);
        
        console.log(`${symbol} (${name}) Balance: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
      } catch (error) {
        console.log(`DAI Token not found at ${DAI_ADDRESS}`);
      }
    }

    // Check USDC balance
    if (USDC_ADDRESS !== "0x...") {
      const usdcToken = new ethers.Contract(USDC_ADDRESS, tokenABI, ethers.provider);
      
      try {
        const name = await usdcToken.name();
        const symbol = await usdcToken.symbol();
        const decimals = await usdcToken.decimals();
        const balance = await usdcToken.balanceOf(addressToCheck);
        
        console.log(`${symbol} (${name}) Balance: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
      } catch (error) {
        console.log(`USDC Token not found at ${USDC_ADDRESS}`);
      }
    }

  } catch (error) {
    console.error("Error checking balances:", error.message);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
