'use client';

import { useEffect, useCallback, useState } from 'react';
import { ensureRelayerReady, userDecrypt, encrypt32Single, encryptAskThresholdBatch } from './relayerClient';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { encodeFunctionData, decodeFunctionResult } from 'viem';
import { BlindEscrowABI } from '@/abi/BlindEscrowABI';
import { BLIND_ESCROW_ADDR } from '@/config/contracts';

// Utility function to convert Uint8Array to hex string
function uint8ArrayToHex(uint8Array: Uint8Array): `0x${string}` {
  return `0x${Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
}

export function useFhevm() {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  useEffect(() => {
    console.log('🔧 Initializing FHE relayer...', {
      relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL,
      chainId: process.env.NEXT_PUBLIC_CHAIN_ID
    });
    
    ensureRelayerReady()
      .then(() => {
        console.log('✅ FHE relayer ready!');
        setReady(true);
      })
      .catch((e) => {
        console.error('❌ FHE relayer not ready:', e);
        console.error('💡 This uses CDN-based FHEVM SDK (like new-fhevm-template)');
        console.error('   Make sure MetaMask is connected to Sepolia testnet');
        console.error('   The SDK will load automatically from CDN');
        setErr(e instanceof Error ? e.message : String(e));
      });
  }, []);

  // Tạo OPEN deal kèm ask + threshold (batch proof)
  const createOpenWithAsk = useCallback(async (args: {
    assetToken: `0x${string}`;
    assetAmountRaw: string;          // đã quy về đơn vị nhỏ nhất
    payToken: `0x${string}`;
    ask: number;                     // chú ý decimals: nếu dùng USDC 6 decimals => 100 USDC = 100_000_000
    threshold: number;
  }) => {
    if (!ready) throw new Error('FHE relayer is not ready. Check NEXT_PUBLIC_RELAYER_URL / NEXT_PUBLIC_CHAIN_ID');
    if (!walletClient || !address) throw new Error('Wallet not connected');

    const buyerZero = '0x0000000000000000000000000000000000000000';
    const modeOpen = 1; // DealMode.OPEN

    // Debug: Log contract address and user address
    console.log("🔍 Contract info:", {
      BLIND_ESCROW_ADDR,
      address,
      chainId
    });

    // Validate contract address
    if (!BLIND_ESCROW_ADDR || BLIND_ESCROW_ADDR === "") {
      throw new Error('BlindEscrow contract address is not set. Please check your configuration.');
    }

    // 1) Approve asset token first
    console.log("🔐 Step 1: Approving asset token...");
    const approveData = encodeFunctionData({
      abi: [
        {
          "inputs": [
            {"internalType": "address", "name": "spender", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
          ],
          "name": "approve",
          "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      functionName: "approve",
      args: [BLIND_ESCROW_ADDR as `0x${string}`, BigInt(args.assetAmountRaw)]
    });

    const approveHash = await walletClient.sendTransaction({
      to: args.assetToken,
      data: approveData,
    });
    
    console.log("⏳ Waiting for approval transaction...");
    await publicClient?.waitForTransactionReceipt({ hash: approveHash });
    console.log("✅ Asset token approved!");

    // 2) batch encrypt (KHÔNG mock)
    const { askHandle, thresholdHandle, inputProof } =
      await encryptAskThresholdBatch(BLIND_ESCROW_ADDR as `0x${string}`, address, args.ask, args.threshold);

    // Convert Uint8Array to hex strings for viem
    const askHandleHex = uint8ArrayToHex(askHandle as Uint8Array);
    const thresholdHandleHex = uint8ArrayToHex(thresholdHandle as Uint8Array);
    const inputProofHex = uint8ArrayToHex(inputProof as Uint8Array);

    console.log("🔐 Encrypted values converted to hex successfully");

    // 3) gọi contract — signature "2 handles + 1 proof"
    const createDealData = encodeFunctionData({
      abi: BlindEscrowABI.abi as any,
      functionName: "createDealWithAsk",
      args: [
        buyerZero,
        modeOpen,
        args.assetToken,
        BigInt(args.assetAmountRaw),
        args.payToken,
        askHandleHex,
        thresholdHandleHex,
        inputProofHex
      ]
    });

    console.log("🔐 Step 2: Creating deal with encrypted ask and threshold...");
    const hash = await walletClient.sendTransaction({
      to: BLIND_ESCROW_ADDR as `0x${string}`,
      data: createDealData,
    });

    console.log("⏳ Waiting for deal creation transaction...");
    const receipt = await publicClient?.waitForTransactionReceipt({ hash });
    console.log("✅ Deal created successfully!");
    return receipt;
  }, [ready, walletClient, address, publicClient]);

  // Nộp bid (encrypt đơn)
  const submitBid = useCallback(async (dealId: bigint, bid: number) => {
    if (!ready) throw new Error('FHE relayer is not ready');
    if (!walletClient || !address) throw new Error('Wallet not connected');

    const { input, proof } = await encrypt32Single(BLIND_ESCROW_ADDR as `0x${string}`, address, bid);
    
    // Convert Uint8Array to hex strings for viem
    const inputHex = uint8ArrayToHex(input as Uint8Array);
    const proofHex = uint8ArrayToHex(proof as Uint8Array);
    
    const submitBidData = encodeFunctionData({
      abi: BlindEscrowABI.abi as any,
      functionName: "submitBid",
      args: [dealId, inputHex, proofHex]
    });

    const hash = await walletClient.sendTransaction({
      to: BLIND_ESCROW_ADDR as `0x${string}`,
      data: submitBidData,
    });

    const receipt = await publicClient?.waitForTransactionReceipt({ hash });
    return receipt;
  }, [ready, walletClient, address, publicClient]);

  // Reveal (ví dụ decrypt matched)
  const revealAndDecrypt = useCallback(async (dealId: bigint) => {
    if (!publicClient) throw new Error('Public client not available');

    const revealData = encodeFunctionData({
      abi: BlindEscrowABI.abi as any,
      functionName: "revealMatchWithValues",
      args: [dealId]
    });

    const result = await publicClient.call({
      to: BLIND_ESCROW_ADDR as `0x${string}`,
      data: revealData,
    });

    if (!result.data) throw new Error('No data returned from reveal');

    // Decode the result (assuming it returns [ebool, euint32, euint32, euint32])
    const decoded = decodeFunctionResult({
      abi: BlindEscrowABI.abi as any,
      functionName: "revealMatchWithValues",
      data: result.data,
    });

    const matched = await userDecrypt<boolean>((decoded as any)[0]); // ebool
    const askPlain = await userDecrypt<number>((decoded as any)[1]); // euint32
    const bidPlain = await userDecrypt<number>((decoded as any)[2]);
    const thPlain = await userDecrypt<number>((decoded as any)[3]);
    return { matched, askPlain, bidPlain, thPlain };
  }, [publicClient]);

  return {
    fheReady: ready,
    fheError: err,
    createOpenWithAsk,
    submitBid,
    revealAndDecrypt,
  };
}