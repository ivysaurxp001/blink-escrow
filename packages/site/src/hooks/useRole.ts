import { useMemo } from "react";
import { useAccount } from "wagmi";
import { DealInfo, Address } from "@/lib/types";

export function useRole(deal?: DealInfo) {
  const { address } = useAccount();

  const role = useMemo(() => {
    if (!address || !deal) return "GUEST";
    
    if (address.toLowerCase() === deal.seller.toLowerCase()) {
      return "SELLER";
    }
    
    if (address.toLowerCase() === deal.buyer.toLowerCase()) {
      return "BUYER";
    }
    
    return "GUEST";
  }, [address, deal]);

  const isSeller = role === "SELLER";
  const isBuyer = role === "BUYER";
  const isGuest = role === "GUEST";

  return {
    role,
    isSeller,
    isBuyer,
    isGuest,
  };
}

export function useUserRole() {
  const { address } = useAccount();
  
  return {
    address: address as Address | undefined,
    isConnected: !!address,
  };
}
