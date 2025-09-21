'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useDealsQuery } from '@/hooks/useDealsQuery';
import { DealInfo, DealState } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDealState, getStateColor, shortAddress } from '@/lib/format';
import { MOCK_TOKENS } from '@/abi/MockTokenAddresses';
import { useRole } from '@/hooks/useRole';
import Link from 'next/link';

// Function to get token name from address
function getTokenName(address: string): string {
  const tokenMap: { [key: string]: string } = {
    [MOCK_TOKENS.Z_USDC]: "Z-USDC",
    [MOCK_TOKENS.Z_DAI]: "Z-DAI",
  };
  return tokenMap[address] || shortAddress(address);
}

export function DealHistory() {
  const { address } = useAccount();
  const { deals, loading, error } = useDealsQuery();
  const [myDeals, setMyDeals] = useState<DealInfo[]>([]);

  useEffect(() => {
    if (deals && address) {
      // Filter deals where user is seller or buyer
      const filteredDeals = deals.filter(deal => 
        deal.seller.toLowerCase() === address.toLowerCase() || 
        deal.buyer.toLowerCase() === address.toLowerCase()
      );
      setMyDeals(filteredDeals);
    }
  }, [deals, address]);

  if (!address) {
    return (
      <Card className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            📊 Deal History
            <span className="ml-2 text-red-400 text-sm">Not Connected</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-4">
            Connect your wallet to view your deal history
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            📊 Deal History
            <span className="ml-2 text-green-400 text-sm">Connected</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-white/20 rounded"></div>
            <div className="h-4 bg-white/20 rounded"></div>
            <div className="h-4 bg-white/20 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            📊 Deal History
            <span className="ml-2 text-red-400 text-sm">Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400 text-center py-4">
            Failed to load deal history
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          📊 Deal History
          <span className="ml-2 text-green-400 text-sm">Connected</span>
        </CardTitle>
        <p className="text-gray-300 text-sm">
          Wallet: {shortAddress(address)}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {myDeals.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-400 mb-2">No deals found</p>
            <p className="text-sm text-gray-500">
              You haven't created or participated in any deals yet
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {myDeals.map((deal) => {
              // Calculate role without using hooks
              const isSeller = address && deal.seller.toLowerCase() === address.toLowerCase();
              const isBuyer = address && deal.buyer.toLowerCase() === address.toLowerCase();
              const role = isSeller ? 'Seller' : isBuyer ? 'Buyer' : 'Participant';
              
              return (
                <Link 
                  key={deal.id} 
                  href={`/deals/${deal.id}`}
                  className="block p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 rounded-lg backdrop-blur-sm hover:border-blue-400/40 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">Deal #{deal.id}</span>
                      <Badge 
                        className={`${getStateColor(deal.state)} bg-opacity-20 border-opacity-30 text-xs`}
                      >
                        {formatDealState(deal.state)}
                      </Badge>
                    </div>
                    <span className="text-xs text-blue-300 font-medium">
                      {role}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-300 space-y-1">
                    <div className="flex justify-between">
                      <span>Asset:</span>
                      <span className="text-white">{deal.assetAmount} {getTokenName(deal.assetToken)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment:</span>
                      <span className="text-white">{getTokenName(deal.payToken)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Counterparty:</span>
                      <span className="text-white">
                        {isSeller ? shortAddress(deal.buyer) : shortAddress(deal.seller)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        
        {myDeals.length > 0 && (
          <div className="pt-3 border-t border-white/10">
            <Link 
              href="/marketplace"
              className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
            >
              View All Deals →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
