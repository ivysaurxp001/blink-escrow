import { useCallback, useEffect, useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { DealInfo, DealMode, DealState } from "@/lib/types";
import { useBlindEscrow } from "./useBlindEscrow";

export function useDealsQuery() {
  const { address } = useAccount();
  const { getDeal } = useBlindEscrow();
  const [deals, setDeals] = useState<DealInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = useCallback(async () => {
    if (!getDeal) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Mock implementation - in real app this would read nextDealId from contract
      const mockDealIds = [1, 2, 3]; // This should be dynamic based on nextDealId
      const fetchedDeals: DealInfo[] = [];
      
      for (const id of mockDealIds) {
        try {
          const deal = await getDeal(id);
          fetchedDeals.push(deal);
        } catch (err) {
          // Deal might not exist, skip
          console.log(`Deal ${id} not found, skipping`);
        }
      }
      
      setDeals(fetchedDeals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch deals");
    } finally {
      setLoading(false);
    }
  }, [getDeal]);

  // Filter deals by type
  const openDeals = useMemo(() => 
    deals.filter(deal => 
      deal.mode === DealMode.OPEN && 
      deal.buyer === "0x0000000000000000000000000000000000000000"
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
    refetch: fetchDeals,
  };
}
