#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🔨 Testing compilation...\n');

try {
  const output = execSync('npx hardhat compile', {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  console.log('✅ Compilation successful!');
  console.log(output);
} catch (error) {
  console.error('❌ Compilation failed:');
  console.error(error.stdout || error.message);
  process.exit(1);
}
