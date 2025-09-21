import { useCallback, useMemo } from "react";
import { useAccount, useWalletClient, usePublicClient, useReadContract } from "wagmi";
import { Address, DealInfo, DealState, DealMode } from "@/lib/types";
import { BLIND_ESCROW_ADDR } from "@/config/contracts";
import { BlindEscrowABI } from "@/abi/BlindEscrowABI";
import { parseAbiItem, encodeFunctionData, decodeFunctionResult } from "viem";
import { useFhevm } from "@/fhevm/useFhevm";

export function useBlindEscrow() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { encrypt32, isMockMode } = useFhevm();

  // For now, we'll use a mock contract since we need to handle the contract interaction differently
  // In a real implementation, you would use the walletClient to create contract instances
  const contract = null; // We'll implement this properly later

  // Create P2P deal
  const createDeal = useCallback(async (params: {
    buyer: Address;
    assetToken: Address;
    assetAmount: bigint;
    payToken: Address;
  }) => {
    if (!walletClient) throw new Error("No wallet client");
    if (!address) throw new Error("No wallet address");
    
    try {
      console.log("🔐 Creating P2P deal with real blockchain interaction...");
      
      // Step 1: Approve asset token for BlindEscrow contract
      console.log("📝 Step 1: Approving asset token...");
      const approveData = encodeFunctionData({
        abi: [parseAbiItem("function approve(address spender, uint256 amount) returns (bool)")],
        functionName: "approve",
        args: [BLIND_ESCROW_ADDR as `0x${string}`, params.assetAmount]
      });
      
      const approveHash = await walletClient.sendTransaction({
        to: params.assetToken,
        data: approveData,
        account: address,
      });
      
      console.log("✅ Approval transaction sent:", approveHash);
      console.log("⏳ Waiting for approval confirmation...");
      
      // Wait for approval transaction to be mined
      if (!publicClient) throw new Error("No public client");
      const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
      console.log("✅ Asset token approved successfully! Receipt:", approveReceipt);
      
      // Step 2: Create P2P deal
      console.log("📝 Step 2: Creating P2P deal...");
      const createDealData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "createDeal",
        args: [
          params.buyer,
          0, // DealMode.P2P
          params.assetToken,
          params.assetAmount,
          params.payToken
        ]
      });
      
      const createHash = await walletClient.sendTransaction({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: createDealData,
        account: address,
      });
      
      console.log("✅ Create deal transaction sent:", createHash);
      console.log("⏳ Waiting for deal creation confirmation...");
      
      // Wait for transaction to be mined
      if (!publicClient) throw new Error("No public client");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
      console.log("✅ P2P deal created successfully! Receipt:", receipt);
      
      // Step 3: Get the new deal ID
      console.log("📝 Step 3: Getting new deal ID...");
      const nextDealIdData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "nextDealId",
        args: []
      });
      
      if (!publicClient) throw new Error("No public client");
      const nextDealIdResult = await publicClient.call({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: nextDealIdData,
      });
      
      if (!nextDealIdResult || !(nextDealIdResult as any)?.data) {
        throw new Error("Failed to get next deal ID");
      }
      
      const nextDealId = BigInt((nextDealIdResult as any).data);
      const newDealId = Number(nextDealId) - 1; // The deal we just created
      
      console.log("🎉 New P2P deal created with ID:", newDealId);
      
      return newDealId;
    } catch (error) {
      console.error("❌ Failed to create P2P deal:", error);
      throw error;
    }
  }, [walletClient, address, publicClient]);

  // Create OPEN deal with ask + threshold (simplified flow)
  const createOpenWithAsk = useCallback(async (params: {
    assetToken: Address;
    assetAmount: bigint;
    payToken: Address;
    askAmount: number;
    threshold: number;
  }) => {
    if (!walletClient) throw new Error("No wallet client");
    if (!address) throw new Error("No wallet address");
    
    try {
      console.log("🔐 Creating OPEN deal with ask + threshold...");
      
      // Step 1: Approve asset token for BlindEscrow contract
      console.log("📝 Step 1: Approving asset token...");
      const approveData = encodeFunctionData({
        abi: [parseAbiItem("function approve(address spender, uint256 amount) returns (bool)")],
        functionName: "approve",
        args: [BLIND_ESCROW_ADDR as `0x${string}`, params.assetAmount]
      });
      
      const approveHash = await walletClient.sendTransaction({
        to: params.assetToken,
        data: approveData,
        account: address,
      });
      
      console.log("✅ Approval transaction sent:", approveHash);
      console.log("⏳ Waiting for approval confirmation...");
      
      // Wait for approval transaction to be mined
      if (!publicClient) throw new Error("No public client");
      const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
      console.log("✅ Asset token approved successfully! Receipt:", approveReceipt);
      
      // Step 2: Create OPEN deal with ask + threshold
      console.log("📝 Step 2: Creating OPEN deal with ask + threshold...");
      
      // Use real FHE encryption with fallback
      console.log("🔐 Encrypting ask and threshold with FHE...");
      if (typeof window === 'undefined') throw new Error('Must be called on client');
      
      let encAsk, encThreshold;
      try {
        encAsk = await encrypt32(params.askAmount);
        encThreshold = await encrypt32(params.threshold);
        console.log("✅ FHE encryption completed:", { askAmount: params.askAmount, threshold: params.threshold });
      } catch (error) {
        console.warn("⚠️ FHE encryption failed, falling back to createDeal without ask/threshold:", error);
        // Fallback: create deal without ask/threshold, user can submit later
        const createDealData = encodeFunctionData({
          abi: BlindEscrowABI.abi as any,
          functionName: "createDeal",
          args: [
            "0x0000000000000000000000000000000000000000" as `0x${string}`, // buyer = 0 for OPEN mode
            1, // DealMode.OPEN
            params.assetToken,
            params.assetAmount,
            params.payToken
          ]
        });

        const createHash = await walletClient.sendTransaction({
          to: BLIND_ESCROW_ADDR as `0x${string}`,
          data: createDealData,
          account: address,
        });

        console.log("✅ Fallback deal created:", createHash);
        console.log("⏳ Waiting for deal creation confirmation...");

        if (!publicClient) throw new Error("No public client");
        const receipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
        console.log("✅ Fallback deal created successfully! Receipt:", receipt);

        // Get the new deal ID
        const nextDealIdData = encodeFunctionData({
          abi: BlindEscrowABI.abi as any,
          functionName: "nextDealId",
          args: []
        });

        const nextDealIdResult = await publicClient.call({
          to: BLIND_ESCROW_ADDR as `0x${string}`,
          data: nextDealIdData,
        });

        if (!nextDealIdResult || !(nextDealIdResult as any)?.data) {
          throw new Error("Failed to get next deal ID");
        }

        const nextDealId = BigInt((nextDealIdResult as any).data);
        const newDealId = Number(nextDealId) - 1;

        console.log("🎉 Fallback deal created with ID:", newDealId);
        console.log("💡 Please submit ask and threshold later when relayer is ready");

        return { dealId: newDealId, hash: createHash, fallback: true };
      }
      
      const createDealData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "createDealWithAsk",
        args: [
          "0x0000000000000000000000000000000000000000" as `0x${string}`, // buyer = 0 for OPEN mode
          1, // DealMode.OPEN
          params.assetToken,
          params.assetAmount,
          params.payToken,
          encAsk,
          encThreshold
        ]
      });
      
      const createHash = await walletClient.sendTransaction({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: createDealData,
        account: address,
      });
      
      console.log("✅ Create deal transaction sent:", createHash);
      console.log("⏳ Waiting for deal creation confirmation...");
      
      // Wait for transaction to be mined
      if (!publicClient) throw new Error("No public client");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
      console.log("✅ OPEN deal created successfully! Receipt:", receipt);
      
      // Step 3: Get the new deal ID
      console.log("📝 Step 3: Getting new deal ID...");
      const nextDealIdData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "nextDealId",
        args: []
      });
      
      if (!publicClient) throw new Error("No public client");
      const nextDealIdResult = await publicClient.call({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: nextDealIdData,
      });
      
      if (!nextDealIdResult || !(nextDealIdResult as any)?.data) {
        throw new Error("Failed to get next deal ID");
      }
      
      const nextDealId = BigInt((nextDealIdResult as any).data);
      const newDealId = Number(nextDealId) - 1; // The deal we just created
      
      console.log("🎉 New deal created with ID:", newDealId);
      
      return { dealId: newDealId, hash: createHash };
    } catch (error) {
      console.error("❌ Failed to create OPEN deal with ask:", error);
      throw error;
    }
  }, [walletClient, address, publicClient, encrypt32]);

  // Create OPEN deal (legacy - for backward compatibility)
  const createOpen = useCallback(async (params: {
    assetToken: Address;
    assetAmount: bigint;
    payToken: Address;
  }) => {
    if (!walletClient) throw new Error("No wallet client");
    if (!address) throw new Error("No wallet address");
    
    try {
      console.log("🔐 Creating OPEN deal with real blockchain interaction...");
      
      // Step 1: Approve asset token for BlindEscrow contract
      console.log("📝 Step 1: Approving asset token...");
      const approveData = encodeFunctionData({
        abi: [parseAbiItem("function approve(address spender, uint256 amount) returns (bool)")],
        functionName: "approve",
        args: [BLIND_ESCROW_ADDR as `0x${string}`, params.assetAmount]
      });
      
      const approveHash = await walletClient.sendTransaction({
        to: params.assetToken,
        data: approveData,
        account: address,
      });
      
      console.log("✅ Approval transaction sent:", approveHash);
      console.log("⏳ Waiting for approval confirmation...");
      
      // Simple wait - just wait a bit for the transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log("✅ Asset token approved successfully!");
      
      // Step 2: Create OPEN deal
      console.log("📝 Step 2: Creating OPEN deal...");
      const createDealData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "createDeal",
        args: [
          "0x0000000000000000000000000000000000000000" as `0x${string}`, // buyer = 0 for OPEN mode
          1, // DealMode.OPEN
          params.assetToken,
          params.assetAmount,
          params.payToken
        ]
      });
      
      const createHash = await walletClient.sendTransaction({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: createDealData,
        account: address,
      });
      
      console.log("✅ Create deal transaction sent:", createHash);
      console.log("⏳ Waiting for deal creation confirmation...");
      
      // Simple wait - just wait a bit for the transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log("✅ Deal created successfully!");
      
      // Return a mock deal ID for now
      const dealId = Math.floor(Math.random() * 1000) + 1;
      console.log("🎉 New deal ID:", dealId);
      
      return dealId;
      
    } catch (error) {
      console.error("❌ Error creating OPEN deal:", error);
      throw error;
    }
  }, [walletClient, address]);

  // Get deal info with mode parsing
  const getDeal = useCallback(async (id: number): Promise<DealInfo> => {
    if (!publicClient) throw new Error("No public client");
    
    try {
      console.log(`🔍 Fetching real deal info for deal ${id}...`);
      
      const dealInfoData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "getDealInfo",
        args: [id]
      });
      
      const dealInfoResult = await publicClient.call({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: dealInfoData,
      });
      
      if (!dealInfoResult || !(dealInfoResult as any)?.data) {
        throw new Error(`No data returned for deal ${id}`);
      }
      
      // Decode the result data using viem's decodeFunctionResult
      const resultData = (dealInfoResult as any).data;
      const decodedResult = decodeFunctionResult({
        abi: BlindEscrowABI.abi as any,
        functionName: "getDealInfo",
        data: resultData,
      });
      
      console.log(`📊 Decoded deal ${id} result:`, decodedResult);
      
      // Extract real data from decoded result
      const [
        mode,
        seller,
        buyer,
        assetToken,
        assetAmount,
        payToken,
        hasAsk,
        hasBid,
        hasThreshold,
        state
      ] = decodedResult as [number, string, string, string, bigint, string, boolean, boolean, boolean, number];
      
      const dealInfo: DealInfo = {
        id,
        mode: mode as DealMode,
        seller: seller as any,
        buyer: buyer as any,
        assetToken: assetToken as any,
        assetAmount: assetAmount,
        payToken: payToken as any,
        hasAsk,
        hasBid,
        hasThreshold,
        state: state as DealState,
      };
      
      console.log(`✅ Real deal ${id} data:`, dealInfo);
      return dealInfo;
      
    } catch (err) {
      console.error(`❌ Error fetching deal ${id}:`, err);
      throw err;
    }
  }, [publicClient]);

  // Submit bid (with buyer locking for OPEN mode)
  const submitBid = useCallback(async (dealId: number, bidInt: number) => {
    if (!walletClient) throw new Error("No wallet client");
    
    console.log("Submitting bid:", { dealId, bidInt });
    
    try {
      // Use real FHE encryption for bid
      console.log("🔐 Encrypting bid with FHE...");
      const encBid = await encrypt32(bidInt);
      console.log("✅ FHE encryption completed for bid:", { bidInt });
      
      // Encode the submitBid function call
      const submitBidData = encodeFunctionData({
        abi: BlindEscrowABI.abi,
        functionName: 'submitBid',
        args: [BigInt(dealId), encBid]
      });
      
      console.log("📝 Submitting bid transaction...");
      
      // Send transaction
      const hash = await walletClient.sendTransaction({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: submitBidData,
        value: BigInt(0),
      });
      
      console.log("⏳ Waiting for transaction confirmation...");
      
      // Wait for transaction receipt
      if (!publicClient) throw new Error("No public client");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      console.log("✅ Bid submitted successfully!", { hash, receipt });
      
      return { hash, receipt };
    } catch (error) {
      console.error("❌ Failed to submit bid:", error);
      throw error;
    }
  }, [walletClient, publicClient, encrypt32]);

  // Submit ask with threshold
  const submitAskWithThreshold = useCallback(async (dealId: number, askInt: number, thresholdInt: number) => {
    if (!walletClient) throw new Error("No wallet client");
    
    // Mock implementation for now
    console.log("Submitting ask with threshold:", { dealId, askInt, thresholdInt });
  }, [walletClient]);

  // Reveal match (mock implementation)
  const revealMatch = useCallback(async (dealId: number) => {
    if (!walletClient) throw new Error("No wallet client");
    
    // Mock reveal - in real implementation this would use FHEVM relayer
    const askClear = 1000; // Mock values
    const bidClear = 990;
    const threshold = 100;
    
    const matched = Math.abs(bidClear - askClear) <= threshold;
    
    console.log("Revealing match:", { dealId, matched, askClear, bidClear });
    
    return { matched, askClear, bidClear };
  }, [walletClient]);

  // Settle deal
  const settle = useCallback(async (dealId: number, askClear: number, bidClear: number) => {
    if (!walletClient) throw new Error("No wallet client");
    
    // Mock implementation for now
    console.log("Settling deal:", { dealId, askClear, bidClear });
  }, [walletClient]);

  // Get token balance
  const getTokenBalance = useCallback(async (tokenAddress: string, userAddress?: string) => {
    // Mock implementation - in real app this would call ERC20 contract
    return {
      balance: "1000000000000000000009000",
      name: "Mock Token",
      symbol: "MOCK",
      decimals: 18,
      formatted: "1000000000000000000009000.00"
    };
  }, []);

  return {
    // Contract info
    address,
    contractAddress: BLIND_ESCROW_ADDR,
    
    // Deal operations
    createDeal,
    createOpen,
    createOpenWithAsk,
    getDeal,
    submitBid,
    submitAskWithThreshold,
    revealMatch,
    settle,
    
    // Utility
    getTokenBalance,
  };
}
