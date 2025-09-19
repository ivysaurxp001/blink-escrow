#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

console.log('🚀 Building and deploying Blind Escrow...');

try {
  // 1. Compile contracts
  console.log('📦 Compiling contracts...');
  execSync('cd packages/fhevm-hardhat-template && npm run compile', { stdio: 'inherit' });
  
  // 2. Deploy contract (you'll need to update the network)
  console.log('🚀 Deploying contract...');
  const deployOutput = execSync('cd packages/fhevm-hardhat-template && npx hardhat run scripts/deploy_blind_escrow.ts --network localhost', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  // Extract contract address from deploy output
  const addressMatch = deployOutput.match(/BlindEscrow deployed at: (0x[a-fA-F0-9]{40})/);
  if (addressMatch) {
    const contractAddress = addressMatch[1];
    console.log(`✅ Contract deployed at: ${contractAddress}`);
    
    // Update config file
    const configPath = path.join('packages', 'site', 'config.ts');
    let configContent = readFileSync(configPath, 'utf8');
    configContent = configContent.replace(
      'BLIND_ESCROW_ADDR: "0x0000000000000000000000000000000000000000"',
      `BLIND_ESCROW_ADDR: "${contractAddress}"`
    );
    writeFileSync(configPath, configContent);
    console.log('📝 Updated config.ts with contract address');
    
    // Generate ABI file
    console.log('📄 Generating ABI file...');
    const artifactsPath = path.join('packages', 'fhevm-hardhat-template', 'artifacts', 'contracts', 'BlindEscrow.sol', 'BlindEscrow.json');
    const artifact = JSON.parse(readFileSync(artifactsPath, 'utf8'));
    
    const abiPath = path.join('packages', 'site', 'abi', 'BlindEscrowABI.ts');
    const abiContent = `export const BlindEscrowABI = {
  "abi": ${JSON.stringify(artifact.abi, null, 2)}
} as const;`;
    
    writeFileSync(abiPath, abiContent);
    console.log('✅ ABI file generated');
    
    console.log('\n🎉 Build and deploy completed successfully!');
    console.log(`📋 Contract Address: ${contractAddress}`);
    console.log('🌐 You can now run the frontend with: cd packages/site && npm run dev');
    
  } else {
    console.error('❌ Could not extract contract address from deploy output');
    console.log('Deploy output:', deployOutput);
  }
  
} catch (error) {
  console.error('❌ Build and deploy failed:', error.message);
  process.exit(1);
}

