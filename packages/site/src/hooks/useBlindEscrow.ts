'use client';

import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { BLIND_ESCROW_ADDR } from "@/config/contracts";
import { BlindEscrowABI } from "@/abi/BlindEscrowABI";
import { parseAbiItem, encodeFunctionData, decodeFunctionResult } from "viem";
import { useCallback } from "react";
import { useFhevm } from "@/fhevm/useFhevm";
import { useDealValues } from "@/contexts/DealValuesContext";

export function useBlindEscrow() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { fheReady, fheError, createOpenWithAsk, submitBid, revealAndDecrypt } = useFhevm();
  const { getDealValues, setDealAsk, setDealBid, setDealThreshold } = useDealValues();

  // Create OPEN deal with ask and threshold (using new FHE implementation)
  const createOpenWithAskThreshold = useCallback(async (params: {
    assetToken: `0x${string}`;
    assetAmount: bigint;
    payToken: `0x${string}`;
    askAmount: number;
    threshold: number;
  }) => {
    if (!fheReady) {
      throw new Error('FHE relayer is not ready. Please wait for initialization.');
    }

    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log("📝 Creating OPEN deal with ask + threshold...");
      
      // Use the new FHE implementation
      const receipt = await createOpenWithAsk({
        assetToken: params.assetToken,
        assetAmountRaw: params.assetAmount.toString(),
        payToken: params.payToken,
        ask: params.askAmount,
        threshold: params.threshold,
      });

      console.log("✅ OPEN deal created successfully:", receipt);
      return receipt;
    } catch (error) {
      console.error("❌ Failed to create OPEN deal:", error);
      throw error;
    }
  }, [fheReady, createOpenWithAsk, walletClient, address]);

  // Submit bid (using new FHE implementation)
  const submitBidToDeal = useCallback(async (dealId: number, bidAmount: number) => {
    if (!fheReady) {
      throw new Error('FHE relayer is not ready. Please wait for initialization.');
    }

    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log("📝 Submitting bid to deal:", dealId, "amount:", bidAmount);
      
      // Use the new FHE implementation
      const receipt = await submitBid(BigInt(dealId), bidAmount);

      console.log("✅ Bid submitted successfully:", receipt);
      return receipt;
    } catch (error) {
      console.error("❌ Failed to submit bid:", error);
      throw error;
    }
  }, [fheReady, submitBid, walletClient, address]);

  // Reveal and decrypt match (using new FHE implementation)
  const revealMatchAndDecrypt = useCallback(async (dealId: number) => {
    if (!fheReady) {
      throw new Error('FHE relayer is not ready. Please wait for initialization.');
    }
    
    try {
      console.log("🔍 Revealing match for deal:", dealId);
      
      // Use the new FHE implementation
      const result = await revealAndDecrypt(BigInt(dealId));

      console.log("✅ Match revealed and decrypted:", result);
      return result;
    } catch (error) {
      console.error("❌ Failed to reveal match:", error);
      throw error;
    }
  }, [fheReady, revealAndDecrypt]);

  // Legacy functions for backward compatibility (simplified)
  const createOpenDeal = useCallback(async (params: {
    assetToken: `0x${string}`;
    assetAmount: bigint;
    payToken: `0x${string}`;
  }) => {
    // Create deal without ask/threshold first
    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      const createDealData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "createDeal",
        args: [
          "0x0000000000000000000000000000000000000000", // buyer = 0 for OPEN mode
          1, // DealMode.OPEN
          params.assetToken,
          params.assetAmount,
          params.payToken,
        ]
      });

      const hash = await walletClient.sendTransaction({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: createDealData,
      });

      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      return receipt;
    } catch (error) {
      console.error("❌ Failed to create OPEN deal:", error);
      throw error;
    }
  }, [walletClient, address, publicClient]);

  return {
    // New FHE implementation
    fheReady,
    fheError,
    createOpenWithAskThreshold,
    submitBidToDeal,
    revealMatchAndDecrypt,
    
    // Legacy functions
    createOpenDeal,
    
    // Context functions
    getDealValues,
    setDealAsk,
    setDealBid,
    setDealThreshold,
  };
}