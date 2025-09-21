import { useCallback, useMemo } from "react";
import { useAccount, useContract, useSigner } from "wagmi";
import { Address, DealInfo, DealState, DealMode } from "@/lib/types";
import { BLIND_ESCROW_ADDR } from "@/config/contracts";
import BlindEscrowABI from "@/abi/BlindEscrowABI";

export function useBlindEscrow() {
  const { address } = useAccount();
  const { data: signer } = useSigner();

  const contract = useContract({
    address: BLIND_ESCROW_ADDR,
    abi: BlindEscrowABI,
    signerOrProvider: signer,
  });

  // Create P2P deal
  const createDeal = useCallback(async (params: {
    buyer: Address;
    assetToken: Address;
    assetAmount: bigint;
    payToken: Address;
  }) => {
    if (!contract) throw new Error("No contract");
    
    const tx = await contract.createDeal(
      params.buyer,
      DealMode.P2P,
      params.assetToken,
      params.assetAmount,
      params.payToken
    );
    await tx.wait();
    const id = await contract.nextDealId();
    return Number(id);
  }, [contract]);

  // Create OPEN deal
  const createOpen = useCallback(async (params: {
    assetToken: Address;
    assetAmount: bigint;
    payToken: Address;
  }) => {
    if (!contract) throw new Error("No contract");
    
    const Zero = "0x0000000000000000000000000000000000000000" as Address;
    const tx = await contract.createDeal(
      Zero,
      DealMode.OPEN,
      params.assetToken,
      params.assetAmount,
      params.payToken
    );
    await tx.wait();
    const id = await contract.nextDealId();
    return Number(id);
  }, [contract]);

  // Get deal info with mode parsing
  const getDeal = useCallback(async (id: number): Promise<DealInfo> => {
    if (!contract) throw new Error("No contract");
    
    const info = await contract.getDealInfo(id);
    return {
      id,
      mode: Number(info[0]) as DealMode,
      seller: info[1] as Address,
      buyer: info[2] as Address,
      assetToken: info[3] as Address,
      assetAmount: info[4] as bigint,
      payToken: info[5] as Address,
      hasAsk: info[6] as boolean,
      hasBid: info[7] as boolean,
      hasThreshold: info[8] as boolean,
      state: Number(info[9]) as DealState,
    };
  }, [contract]);

  // Submit bid (with buyer locking for OPEN mode)
  const submitBid = useCallback(async (dealId: number, bidInt: number) => {
    if (!contract) throw new Error("No contract");
    
    // For now, use mock encryption (will be replaced with real FHEVM)
    const mockEncBid = bidInt; // This should be encrypted with FHEVM
    
    const tx = await contract.submitBid(dealId, mockEncBid);
    await tx.wait();
  }, [contract]);

  // Submit ask with threshold
  const submitAskWithThreshold = useCallback(async (dealId: number, askInt: number, thresholdInt: number) => {
    if (!contract) throw new Error("No contract");
    
    // For now, use mock encryption (will be replaced with real FHEVM)
    const mockEncAsk = askInt;
    const mockEncThreshold = thresholdInt;
    
    const tx = await contract.submitAskWithThreshold(dealId, mockEncAsk, mockEncThreshold);
    await tx.wait();
  }, [contract]);

  // Reveal match (mock implementation)
  const revealMatch = useCallback(async (dealId: number) => {
    if (!contract) throw new Error("No contract");
    
    // Mock reveal - in real implementation this would use FHEVM relayer
    const deal = await getDeal(dealId);
    const askClear = 1000; // Mock values
    const bidClear = 990;
    const threshold = 100;
    
    const matched = Math.abs(bidClear - askClear) <= threshold;
    
    // Bind revealed prices
    const tx = await contract.bindRevealed(dealId, askClear, bidClear);
    await tx.wait();
    
    return { matched, askClear, bidClear };
  }, [contract, getDeal]);

  // Settle deal
  const settle = useCallback(async (dealId: number, askClear: number, bidClear: number) => {
    if (!contract) throw new Error("No contract");
    
    const tx = await contract.settle(dealId, askClear, bidClear);
    await tx.wait();
  }, [contract]);

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
    getDeal,
    submitBid,
    submitAskWithThreshold,
    revealMatch,
    settle,
    
    // Utility
    getTokenBalance,
  };
}