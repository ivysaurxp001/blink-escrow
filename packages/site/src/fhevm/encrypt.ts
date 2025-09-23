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
  const buf = inst.createEncryptedInput(contractAddress, userAddress);
  buf.add32(Number(value)); // nếu contract dùng euint64, đổi .add64
  const { handles, inputProof } = await buf.encrypt();
  return { input: handles[0], proof: inputProof };
}

// Encrypt batch cho ask + threshold → 2 handles + 1 proof
export async function encryptAskThresholdBatch(
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`,
  ask: number | bigint,
  threshold: number | bigint
) {
  const inst = await getRelayerInstance();
  const buf = inst.createEncryptedInput(contractAddress, userAddress);
  buf.add32(Number(ask));
  buf.add32(Number(threshold));
  const { handles, inputProof } = await buf.encrypt();
  return {
    askHandle: handles[0],
    thresholdHandle: handles[1],
    inputProof,
  };
}
