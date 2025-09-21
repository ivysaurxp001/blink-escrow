const { ethers } = require("hardhat");

async function main() {
  // Get the signer (first account)
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get the balance of the deployer
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Address to mint tokens to (change this to your address)
  const recipientAddress = "0x963a2d0BE2eb5d785C6E73ec904fcE8d65691773"; // Change this!
  
  // Token addresses (update these with your deployed token addresses)
  const DAI_ADDRESS = "0x5f3CD01981EFB5C500d20be535C68B980cfFC414"; // Mock DAI
  const USDC_ADDRESS = "0x..."; // Add your USDC address if you have one
  
  // Amount to mint (in token units, e.g., 1000 DAI = 1000 * 10^18)
  const mintAmount = ethers.parseUnits("10000", 18); // 10,000 tokens

  try {
    // Get the token contract
    const tokenABI = [
      "function mint(address to, uint256 amount) external",
      "function balanceOf(address account) external view returns (uint256)",
      "function decimals() external view returns (uint8)",
      "function symbol() external view returns (string)",
      "function name() external view returns (string)"
    ];

    const token = new ethers.Contract(DAI_ADDRESS, tokenABI, deployer);
    
    // Check token info
    const name = await token.name();
    const symbol = await token.symbol();
    const decimals = await token.decimals();
    console.log(`\nToken: ${name} (${symbol})`);
    console.log(`Decimals: ${decimals}`);

    // Check current balance
    const currentBalance = await token.balanceOf(recipientAddress);
    console.log(`Current balance of ${recipientAddress}: ${ethers.formatUnits(currentBalance, decimals)} ${symbol}`);

    // Mint tokens
    console.log(`\nMinting ${ethers.formatUnits(mintAmount, decimals)} ${symbol} to ${recipientAddress}...`);
    
    const tx = await token.mint(recipientAddress, mintAmount);
    console.log("Transaction hash:", tx.hash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);

    // Check new balance
    const newBalance = await token.balanceOf(recipientAddress);
    console.log(`New balance of ${recipientAddress}: ${ethers.formatUnits(newBalance, decimals)} ${symbol}`);

  } catch (error) {
    console.error("Error minting tokens:", error.message);
    
    // If mint function doesn't exist, try to create a simple ERC20 token
    if (error.message.includes("mint")) {
      console.log("\nMint function not found. Creating a simple ERC20 token...");
      await createSimpleToken(recipientAddress, mintAmount);
    }
  }
}

async function createSimpleToken(recipientAddress, mintAmount) {
  const [deployer] = await ethers.getSigners();
  
  // Deploy a simple ERC20 token
  const SimpleToken = await ethers.getContractFactory("SimpleToken");
  const token = await SimpleToken.deploy("Test DAI", "DAI", mintAmount, recipientAddress);
  
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  
  console.log("Simple token deployed to:", tokenAddress);
  console.log(`Minted ${ethers.formatEther(mintAmount)} DAI to ${recipientAddress}`);
  
  return tokenAddress;
}

// Helper function to mint to multiple addresses
async function mintToMultipleAddresses() {
  const [deployer] = await ethers.getSigners();
  
  // List of addresses to mint to
  const addresses = [
    "0x963a2d0BE2eb5d785C6E73ec904fcE8d65691773", // Your address
    "0x...", // Add more addresses here
  ];
  
  const mintAmount = ethers.parseUnits("1000", 18); // 1,000 tokens each
  
  for (const address of addresses) {
    console.log(`\nMinting to ${address}...`);
    await main(); // This will use the address from the main function
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
