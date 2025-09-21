import { useMemo } from "react";
import { useAccount } from "wagmi";
import { DealInfo, Address } from "@/lib/types";

export function useRole(deal?: DealInfo | null) {
  const { address } = useAccount();

  const role = useMemo(() => {
    if (!address || !deal) return "GUEST";
    
    if (address.toLowerCase() === deal.seller.toLowerCase()) {
      return "SELLER";
    }
    
    // For OPEN deals, buyer might be 0x0 (not assigned yet)
    const Zero = "0x0000000000000000000000000000000000000000";
    if (deal.buyer !== Zero && address.toLowerCase() === deal.buyer.toLowerCase()) {
      return "BUYER";
    }
    
    // For OPEN deals with no buyer, user can become buyer
    if (deal.mode === 1 && deal.buyer === Zero) { // DealMode.OPEN = 1
      return "POTENTIAL_BUYER";
    }
    
    return "GUEST";
  }, [address, deal]);

  const isSeller = role === "SELLER";
  const isBuyer = role === "BUYER";
  const isGuest = role === "GUEST";
  const isPotentialBuyer = role === "POTENTIAL_BUYER";

  return {
    role,
    isSeller,
    isBuyer,
    isGuest,
    isPotentialBuyer,
  };
}

export function useUserRole() {
  const { address } = useAccount();
  
  return {
    address: address as Address | undefined,
    isConnected: !!address,
  };
}
