#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import path from 'path';

console.log('🔍 Checking deployment status...\n');

// Check if artifacts exist
const artifactsPath = path.join('artifacts', 'contracts');
if (!existsSync(artifactsPath)) {
  console.log('❌ No artifacts found. Run: npm run compile');
  process.exit(1);
}

// Check BlindEscrow ABI
const blindEscrowAbiPath = path.join('..', 'site', 'abi', 'BlindEscrowABI.ts');
if (existsSync(blindEscrowAbiPath)) {
  console.log('✅ BlindEscrow ABI exists');
} else {
  console.log('❌ BlindEscrow ABI missing. Run: node scripts/generate-abi.mjs');
}

// Check MockToken ABI
const mockTokenAbiPath = path.join('..', 'site', 'abi', 'MockTokenABI.ts');
if (existsSync(mockTokenAbiPath)) {
  console.log('✅ MockToken ABI exists');
} else {
  console.log('❌ MockToken ABI missing. Run: node scripts/generate-abi.mjs');
}

// Check config.ts
const configPath = path.join('..', 'site', 'config.ts');
if (existsSync(configPath)) {
  const configContent = readFileSync(configPath, 'utf8');
  if (configContent.includes('0x0000000000000000000000000000000000000000')) {
    console.log('⚠️  Config.ts has default address. Run: npm run deploy:all');
  } else {
    console.log('✅ Config.ts has contract address');
  }
} else {
  console.log('❌ Config.ts missing');
}

// Check MockTokenAddresses.ts
const mockTokenAddressesPath = path.join('..', 'site', 'abi', 'MockTokenAddresses.ts');
if (existsSync(mockTokenAddressesPath)) {
  const mockContent = readFileSync(mockTokenAddressesPath, 'utf8');
  if (mockContent.includes('0x0000000000000000000000000000000000000000')) {
    console.log('⚠️  MockTokenAddresses.ts has default addresses. Run: npm run deploy:all');
  } else {
    console.log('✅ MockTokenAddresses.ts has token addresses');
  }
} else {
  console.log('❌ MockTokenAddresses.ts missing');
}

// Check .env.local
const envPath = path.join('..', 'site', '.env.local');
if (existsSync(envPath)) {
  console.log('✅ .env.local exists');
} else {
  console.log('⚠️  .env.local missing. Will be created by deploy:all');
}

console.log('\n📋 Summary:');
console.log('   • Run "npm run deploy:all" to deploy everything');
console.log('   • Run "npm run hardhat-node" to start local blockchain');
console.log('   • Run "cd ../site && npm run dev" to start frontend');
