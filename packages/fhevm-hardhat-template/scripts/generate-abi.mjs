#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

// Đọc ABI từ artifacts
const blindEscrowPath = path.join('artifacts', 'contracts', 'BlindEscrow.sol', 'BlindEscrow.json');
const mockTokenPath = path.join('artifacts', 'contracts', 'MockToken.sol', 'MockToken.json');

// Generate BlindEscrow ABI
const blindEscrowArtifact = JSON.parse(readFileSync(blindEscrowPath, 'utf8'));
const blindEscrowContent = `export const BlindEscrowABI = {
  "abi": ${JSON.stringify(blindEscrowArtifact.abi, null, 2)}
} as const;`;

// Generate MockToken ABI
const mockTokenArtifact = JSON.parse(readFileSync(mockTokenPath, 'utf8'));
const mockTokenContent = `export const MockTokenABI = {
  "abi": ${JSON.stringify(mockTokenArtifact.abi, null, 2)}
} as const;`;

// Ghi file ABI
const blindEscrowAbiPath = path.join('..', 'site', 'abi', 'BlindEscrowABI.ts');
const mockTokenAbiPath = path.join('..', 'site', 'abi', 'MockTokenABI.ts');

writeFileSync(blindEscrowAbiPath, blindEscrowContent);
writeFileSync(mockTokenAbiPath, mockTokenContent);

console.log('✅ ABI generated successfully!');
console.log(`📁 BlindEscrow ABI: ${blindEscrowAbiPath}`);
console.log(`📁 MockToken ABI: ${mockTokenAbiPath}`);
