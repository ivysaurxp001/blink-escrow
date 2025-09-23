// packages/site/src/fhevm/encrypt.ts
'use client';

import { getRelayerInstance } from './relayer';

// Encrypt 1 giá trị euint32 (dùng cho submitBid, v.v.)
export async function encrypt32Single(
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`,
  value: number | bigint
) {
  const inst = await getRelayerInstance();
  const input = inst.createEncryptedInput(contractAddress, userAddress);
  input.add32(Number(value)); // nếu contract dùng euint64, đổi .add64
  const enc = await input.encrypt();
  return { input: enc.handles[0], proof: enc.inputProof };
}

// Encrypt batch cho ask + threshold → 2 handles + 1 proof
export async function encryptAskThresholdBatch(
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`,
  ask: number | bigint,
  threshold: number | bigint
) {
  console.log("🔐 Encrypting ask and threshold values...");
  
  // Validate addresses before calling createEncryptedInput
  if (!contractAddress || contractAddress === "" || !contractAddress.startsWith("0x")) {
    throw new Error(`Invalid contract address: ${contractAddress}`);
  }
  if (!userAddress || userAddress === "" || !userAddress.startsWith("0x")) {
    throw new Error(`Invalid user address: ${userAddress}`);
  }
  
  const inst = await getRelayerInstance();
  const input = inst.createEncryptedInput(contractAddress, userAddress);
  input.add32(Number(ask));
  input.add32(Number(threshold));
  const enc = await input.encrypt();
  return {
    askHandle: enc.handles[0],
    thresholdHandle: enc.handles[1],
    inputProof: enc.inputProof,
  };
}
