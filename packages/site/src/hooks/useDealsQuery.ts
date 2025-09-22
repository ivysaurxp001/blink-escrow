import { useCallback, useEffect, useState, useMemo } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { DealInfo, DealMode, DealState } from "@/lib/types";
import { BLIND_ESCROW_ADDR } from "../config/contracts";
import { BlindEscrowABI } from "@/abi/BlindEscrowABI";
import { encodeFunctionData, decodeFunctionResult } from "viem";

export function useDealsQuery(options: { limit?: number; offset?: number } = {}) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [deals, setDeals] = useState<DealInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalDeals, setTotalDeals] = useState(0);
  const { limit = 10, offset = 0 } = options;

  // Function to fetch individual deal info
  const fetchDealInfo = useCallback(async (dealId: number): Promise<DealInfo | null> => {
    if (!publicClient) return null;
    
    try {
      console.log(`🔍 Fetching real deal info for deal ${dealId}...`);
      
      const dealInfoData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "getDealInfo",
        args: [dealId]
      });
      
      const dealInfoResult = await publicClient.call({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: dealInfoData,
      });
      
      console.log(`📊 Raw deal info result for ${dealId}:`, dealInfoResult);
      
      if (!dealInfoResult || !(dealInfoResult as any)?.data) {
        console.log(`❌ No data returned for deal ${dealId}`);
        return null;
      }
      
      // Decode the result data using viem's decodeFunctionResult
      const resultData = (dealInfoResult as any).data;
      console.log(`🔍 Deal ${dealId} raw data:`, resultData);
      
      try {
        // Decode the function result using the ABI
        const decodedResult = decodeFunctionResult({
          abi: BlindEscrowABI.abi as any,
          functionName: "getDealInfo",
          data: resultData,
        });
        
        console.log(`📊 Decoded deal ${dealId} result:`, decodedResult);
        
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
        
        console.log(`🔍 Deal ${dealId} raw seller from blockchain:`, seller);
        
        const dealInfo: DealInfo = {
          id: dealId,
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
        
        console.log(`✅ Real deal ${dealId} data:`, dealInfo);
        return dealInfo;
        
      } catch (decodeError) {
        console.error(`❌ Failed to decode deal ${dealId}:`, decodeError);
        return null;
      }
      
    } catch (err) {
      console.log(`❌ Deal ${dealId} not found or error:`, err);
      return null;
    }
  }, [publicClient]);

  const fetchDeals = useCallback(async () => {
    if (!publicClient) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔍 Fetching real deals from contract...");
      
      // Get nextDealId from contract with timeout
      const nextDealIdData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "nextDealId",
        args: []
      });
      
      console.log("📞 Calling nextDealId...");
      const nextDealIdResult = await Promise.race([
        publicClient.call({
          to: BLIND_ESCROW_ADDR as `0x${string}`,
          data: nextDealIdData,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("RPC timeout")), 15000)
        )
      ]);
      
      console.log("🔍 Raw nextDealId result:", nextDealIdResult);
      console.log("🔍 Result type:", typeof nextDealIdResult);
      console.log("🔍 Result data:", (nextDealIdResult as any)?.data);
      
      // Try to parse the result properly
      let nextDealId: number;
      if ((nextDealIdResult as any)?.data) {
        // Remove 0x prefix and parse as hex
        const hexValue = (nextDealIdResult as any).data.slice(2);
        nextDealId = parseInt(hexValue, 16);
      } else {
        nextDealId = Number(nextDealIdResult);
      }
      
      console.log("📊 Next deal ID from contract:", nextDealId);
      
      // If nextDealId is 0 or invalid, show empty list
      if (!nextDealId || nextDealId <= 0 || isNaN(nextDealId)) {
        console.log("⚠️ Invalid nextDealId, no deals found");
        setDeals([]);
        setError("No deals found - nextDealId is invalid");
        return;
      }
      
      // Store total deals count (nextDealId is already the count of existing deals)
      setTotalDeals(nextDealId);
      
      // Fetch deals with pagination (newest first)
      const totalDealsCount = nextDealId;
      const startId = Math.max(1, totalDealsCount - offset - limit + 1);
      const endId = totalDealsCount - offset + 1;
      const fetchedDeals: DealInfo[] = [];
      
      console.log(`🔄 Fetching deals ${startId} to ${endId - 1} (newest first, offset: ${offset}, limit: ${limit})...`);
      
      // Fetch from newest to oldest
      for (let id = endId - 1; id >= startId; id--) {
        try {
          const deal = await fetchDealInfo(id);
          if (deal) {
            fetchedDeals.push(deal);
            console.log(`✅ Fetched deal ${id}:`, deal);
          }
        } catch (err) {
          console.log(`❌ Failed to fetch deal ${id}:`, err);
          // Continue with other deals
        }
      }
      
      console.log(`🎉 Total deals fetched: ${fetchedDeals.length}`);
      setDeals(fetchedDeals);
    } catch (err) {
      console.error("❌ Error fetching deals:", err);
      
      // Show error if RPC fails
      console.error("❌ Failed to fetch deals from contract:", err);
      setDeals([]);
      setError(err instanceof Error ? err.message : "Failed to fetch deals");
    } finally {
      setLoading(false);
    }
  }, [publicClient, fetchDealInfo, offset, limit]);

  // Filter deals by type
  const openDeals = useMemo(() => 
    deals.filter(deal => 
      deal.mode === DealMode.OPEN
    ), [deals]
  );

  const myDealsAsSeller = useMemo(() => 
    deals.filter(deal => 
      address && deal.seller.toLowerCase() === address.toLowerCase()
    ), [deals, address]
  );

  const myDealsAsBuyer = useMemo(() => 
    deals.filter(deal => 
      address && deal.buyer.toLowerCase() === address.toLowerCase()
    ), [deals, address]
  );

  const activeDeals = useMemo(() => 
    deals.filter(deal => 
      deal.state !== DealState.Settled && 
      deal.state !== DealState.Canceled
    ), [deals]
  );

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  return {
    deals,
    openDeals,
    myDealsAsSeller,
    myDealsAsBuyer,
    activeDeals,
    loading,
    error,
    totalDeals,
    refetch: fetchDeals,
  };
}
