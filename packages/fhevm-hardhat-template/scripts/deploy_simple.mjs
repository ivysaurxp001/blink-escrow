#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🚀 Simple deployment script...\n');

// Function to retry command
function retryCommand(command, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${maxRetries}: ${command}`);
      const output = execSync(command, {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 120000 // 2 minutes timeout
      });
      return output;
    } catch (error) {
      console.log(`❌ Attempt ${i + 1} failed: ${error.message}`);
      if (i === maxRetries - 1) {
        throw error;
      }
      console.log('⏳ Waiting 5 seconds before retry...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

async function main() {
  try {
    // Step 1: Deploy BlindEscrow
    console.log('📦 Deploying BlindEscrow...');
    const deployOutput = await retryCommand('npx hardhat run scripts/deploy_blind_escrow.ts --network sepolia');
    console.log(deployOutput);
    
    const addressMatch = deployOutput.match(/BlindEscrow deployed at: (0x[a-fA-F0-9]{40})/);
    if (!addressMatch) {
      throw new Error('Could not extract contract address');
    }
    const blindEscrowAddress = addressMatch[1];
    console.log(`✅ BlindEscrow deployed at: ${blindEscrowAddress}\n`);
    
    // Step 2: Deploy Mock Tokens
    console.log('🪙 Deploying Mock Tokens...');
    const mockOutput = await retryCommand('npx hardhat run scripts/deploy_mock_tokens.ts --network sepolia');
    console.log(mockOutput);
    
    const usdcMatch = mockOutput.match(/MockUSDC deployed at: (0x[a-fA-F0-9]{40})/);
    const daiMatch = mockOutput.match(/MockDAI deployed at: (0x[a-fA-F0-9]{40})/);
    
    if (!usdcMatch || !daiMatch) {
      throw new Error('Could not extract token addresses');
    }
    
    const mockUSDCAddress = usdcMatch[1];
    const mockDAIAddress = daiMatch[1];
    
    console.log(`✅ MockUSDC deployed at: ${mockUSDCAddress}`);
    console.log(`✅ MockDAI deployed at: ${mockDAIAddress}\n`);
    
    // Step 3: Generate ABI
    console.log('📄 Generating ABI...');
    execSync('node scripts/generate-abi.mjs', { cwd: process.cwd(), encoding: 'utf8' });
    console.log('✅ ABI generated successfully!\n');
    
    console.log('🎉 Deployment completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • BlindEscrow: ${blindEscrowAddress}`);
    console.log(`   • MockUSDC: ${mockUSDCAddress}`);
    console.log(`   • MockDAI: ${mockDAIAddress}`);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

main();
