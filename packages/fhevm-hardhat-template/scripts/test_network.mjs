#!/usr/bin/env node

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";
const INFURA_API_KEY = process.env.INFURA_API_KEY ?? "";

console.log('🔍 Testing network connection...\n');

// Test 1: Check environment variables
console.log('📋 Environment Variables:');
console.log(`   PRIVATE_KEY: ${PRIVATE_KEY ? '✅ Set' : '❌ Missing'} (length: ${PRIVATE_KEY.length})`);
console.log(`   INFURA_API_KEY: ${INFURA_API_KEY ? '✅ Set' : '❌ Missing'} (length: ${INFURA_API_KEY.length})`);

if (!PRIVATE_KEY || !INFURA_API_KEY) {
  console.log('\n❌ Missing environment variables!');
  console.log('Please check your .env file:');
  console.log('   PRIVATE_KEY=0x...');
  console.log('   INFURA_API_KEY=...');
  process.exit(1);
}

// Test 2: Check private key format
if (!PRIVATE_KEY.startsWith('0x')) {
  console.log('\n⚠️  Warning: PRIVATE_KEY should start with 0x');
  console.log('   Current:', PRIVATE_KEY);
  console.log('   Should be: 0x' + PRIVATE_KEY);
}

// Test 3: Test network connection
console.log('\n🌐 Testing Sepolia connection...');
try {
  const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${INFURA_API_KEY}`);
  
  // Test connection with timeout
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Connection timeout')), 10000)
  );
  
  const connectionPromise = provider.getNetwork();
  
  const network = await Promise.race([connectionPromise, timeoutPromise]);
  
  console.log(`   ✅ Connected to: ${network.name} (Chain ID: ${network.chainId})`);
  
  // Test wallet
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log(`   ✅ Wallet address: ${wallet.address}`);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  const balanceEth = ethers.formatEther(balance);
  console.log(`   ✅ Balance: ${balanceEth} ETH`);
  
  if (parseFloat(balanceEth) < 0.01) {
    console.log('\n⚠️  Warning: Low balance! You need Sepolia ETH for deployment.');
    console.log('   Get some from: https://sepoliafaucet.com/');
  }
  
} catch (error) {
  console.log(`   ❌ Connection failed: ${error.message}`);
  
  if (error.message.includes('timeout')) {
    console.log('\n💡 Solutions:');
    console.log('   1. Check your internet connection');
    console.log('   2. Try a different RPC provider');
    console.log('   3. Check if Infura API key is correct');
  }
  
  process.exit(1);
}

console.log('\n✅ Network test passed! Ready to deploy.');
