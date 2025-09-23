'use client';

import { useEffect, useCallback, useState } from 'react';
import { ensureRelayerReady, userDecrypt, encrypt32Single, encryptAskThresholdBatch } from './relayerClient';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { encodeFunctionData, decodeFunctionResult } from 'viem';
import { BlindEscrowABI } from '@/abi/BlindEscrowABI';
import { BLIND_ESCROW_ADDR } from '@/config/contracts';

export function useFhevm() {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  useEffect(() => {
    ensureRelayerReady()
      .then(() => setReady(true))
      .catch((e) => {
        console.error('FHE relayer not ready:', e);
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

    // 1) batch encrypt (KHÔNG mock)
    const { askHandle, thresholdHandle, inputProof } =
      await encryptAskThresholdBatch(BLIND_ESCROW_ADDR as `0x${string}`, address, args.ask, args.threshold);

    // 2) gọi contract — signature "2 handles + 1 proof"
    const createDealData = encodeFunctionData({
      abi: BlindEscrowABI.abi as any,
      functionName: "createDealWithAsk",
      args: [
        buyerZero,
        modeOpen,
        args.assetToken,
        BigInt(args.assetAmountRaw),
        args.payToken,
        askHandle,
        thresholdHandle,
        inputProof
      ]
    });

    const hash = await walletClient.sendTransaction({
      to: BLIND_ESCROW_ADDR as `0x${string}`,
      data: createDealData,
    });

    const receipt = await publicClient?.waitForTransactionReceipt({ hash });
    return receipt;
  }, [ready, walletClient, address, publicClient]);

  // Nộp bid (encrypt đơn)
  const submitBid = useCallback(async (dealId: bigint, bid: number) => {
    if (!ready) throw new Error('FHE relayer is not ready');
    if (!walletClient || !address) throw new Error('Wallet not connected');

    const { input, proof } = await encrypt32Single(BLIND_ESCROW_ADDR as `0x${string}`, address, bid);
    
    const submitBidData = encodeFunctionData({
      abi: BlindEscrowABI.abi as any,
      functionName: "submitBid",
      args: [dealId, input, proof]
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