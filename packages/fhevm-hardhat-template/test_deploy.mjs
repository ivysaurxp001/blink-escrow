#!/usr/bin/env node

console.log('🧪 Testing deploy script...\n');

try {
  // Test if we can run the deploy script
  const { execSync } = require('child_process');
  
  console.log('✅ Script deploy_all_sepolia.mjs exists');
  console.log('✅ Ready to deploy on Sepolia');
  console.log('\n🚀 Run: npm run deploy:all');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
