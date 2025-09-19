#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

console.log('🚀 Starting full deployment process on Sepolia...\n');

// Step 1: Deploy BlindEscrow contract
console.log('📦 Step 1: Deploying BlindEscrow contract on Sepolia...');
try {
  const deployOutput = execSync('npx hardhat run scripts/deploy_blind_escrow.ts --network sepolia', {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  console.log(deployOutput);
  
  // Extract contract address from output
  const addressMatch = deployOutput.match(/BlindEscrow deployed at: (0x[a-fA-F0-9]{40})/);
  if (!addressMatch) {
    throw new Error('Could not extract contract address from deployment output');
  }
  const blindEscrowAddress = addressMatch[1];
  console.log(`✅ BlindEscrow deployed at: ${blindEscrowAddress}\n`);
  
} catch (error) {
  console.error('❌ Failed to deploy BlindEscrow:', error.message);
  console.error('Make sure you have:');
  console.error('1. Sepolia ETH in your wallet');
  console.error('2. Correct MNEMONIC and INFURA_API_KEY in .env');
  process.exit(1);
}

// Step 2: Deploy Mock Tokens
console.log('🪙 Step 2: Deploying Mock Tokens on Sepolia...');
try {
  const mockOutput = execSync('npx hardhat run scripts/deploy_mock_tokens.ts --network sepolia', {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  console.log(mockOutput);
  
  // Extract token addresses from output
  const usdcMatch = mockOutput.match(/MockUSDC deployed at: (0x[a-fA-F0-9]{40})/);
  const daiMatch = mockOutput.match(/MockDAI deployed at: (0x[a-fA-F0-9]{40})/);
  
  if (!usdcMatch || !daiMatch) {
    throw new Error('Could not extract token addresses from deployment output');
  }
  
  const mockUSDCAddress = usdcMatch[1];
  const mockDAIAddress = daiMatch[1];
  
  console.log(`✅ MockUSDC deployed at: ${mockUSDCAddress}`);
  console.log(`✅ MockDAI deployed at: ${mockDAIAddress}\n`);
  
} catch (error) {
  console.error('❌ Failed to deploy Mock Tokens:', error.message);
  process.exit(1);
}

// Step 3: Generate ABI files
console.log('📄 Step 3: Generating ABI files...');
try {
  execSync('node scripts/generate-abi.mjs', {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  console.log('✅ ABI files generated successfully!\n');
} catch (error) {
  console.error('❌ Failed to generate ABI files:', error.message);
  process.exit(1);
}

// Step 4: Update frontend config
console.log('⚙️ Step 4: Updating frontend configuration...');
try {
  // Read current config
  const configPath = path.join('..', 'site', 'config.ts');
  let configContent = readFileSync(configPath, 'utf8');
  
  // Update BlindEscrow address
  configContent = configContent.replace(
    /BLIND_ESCROW_ADDR: process\.env\.NEXT_PUBLIC_BLIND_ESCROW_ADDR \|\| "0x0000000000000000000000000000000000000000"/,
    `BLIND_ESCROW_ADDR: process.env.NEXT_PUBLIC_BLIND_ESCROW_ADDR || "${blindEscrowAddress}"`
  );
  
  writeFileSync(configPath, configContent);
  console.log(`✅ Updated config.ts with BlindEscrow address: ${blindEscrowAddress}`);
  
  // Update MockToken addresses
  const mockTokenPath = path.join('..', 'site', 'abi', 'MockTokenAddresses.ts');
  const mockTokenContent = `// Auto-generated from deploy_all_sepolia.mjs
// This file will be updated automatically when you run: npm run deploy:all:sepolia

export const MOCK_TOKENS = {
  MOCK_USDC: "${mockUSDCAddress}",
  MOCK_DAI: "${mockDAIAddress}",
} as const;

export const MOCK_USDC_ADDRESS = "${mockUSDCAddress}";
export const MOCK_DAI_ADDRESS = "${mockDAIAddress}";
`;
  
  writeFileSync(mockTokenPath, mockTokenContent);
  console.log(`✅ Updated MockTokenAddresses.ts with token addresses`);
  
} catch (error) {
  console.error('❌ Failed to update frontend config:', error.message);
  process.exit(1);
}

// Step 5: Create .env.local template
console.log('📝 Step 5: Creating .env.local template...');
try {
  const envTemplate = `# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=11155111

# Relayer Configuration  
NEXT_PUBLIC_RELAYER_URL=http://localhost:3001

# Contract Address (auto-updated)
NEXT_PUBLIC_BLIND_ESCROW_ADDR=${blindEscrowAddress}

# FHEVM Configuration
NEXT_PUBLIC_FHEVM_RELAYER_URL=http://localhost:3001
NEXT_PUBLIC_FHEVM_CHAIN_ID=11155111
`;

  const envPath = path.join('..', 'site', '.env.local');
  writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env.local template');
  
} catch (error) {
  console.error('❌ Failed to create .env.local:', error.message);
  process.exit(1);
}

console.log('\n🎉 Full deployment completed successfully on Sepolia!');
console.log('\n📋 Summary:');
console.log(`   • BlindEscrow: ${blindEscrowAddress}`);
console.log(`   • MockUSDC: ${mockUSDCAddress}`);
console.log(`   • MockDAI: ${mockDAIAddress}`);
console.log('\n🚀 Next steps:');
console.log('   1. Start FHEVM relayer: npm run relayer');
console.log('   2. Start frontend: cd ../site && npm run dev');
console.log('   3. Open http://localhost:3000/blind-escrow');
console.log('\n💡 Don\'t forget to:');
console.log('   • Switch MetaMask to Sepolia Testnet (Chain ID: 11155111)');
console.log('   • Approve tokens before creating deals');
console.log('   • Get Sepolia ETH from faucet if needed');
console.log('\n🔗 Sepolia Explorer:');
console.log(`   • BlindEscrow: https://sepolia.etherscan.io/address/${blindEscrowAddress}`);
console.log(`   • MockUSDC: https://sepolia.etherscan.io/address/${mockUSDCAddress}`);
console.log(`   • MockDAI: https://sepolia.etherscan.io/address/${mockDAIAddress}`);
