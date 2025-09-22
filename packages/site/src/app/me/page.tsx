"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAccount } from "wagmi";
import { useBlindEscrow } from "@/hooks/useBlindEscrow";
import { shortAddress } from "@/lib/format";
import { MOCK_USDC_ADDR, MOCK_DAI_ADDR } from "../../config/contracts";

export default function MePage() {
  const { address, isConnected } = useAccount();
  const { getTokenBalance } = useBlindEscrow();
  const [balances, setBalances] = useState({
    usdc: { balance: "0", formatted: "0.00", symbol: "USDC" },
    dai: { balance: "0", formatted: "0.00", symbol: "DAI" },
  });

  const loadBalances = async () => {
    if (!address) return;
    
    try {
      const [usdcBalance, daiBalance] = await Promise.all([
        getTokenBalance(MOCK_USDC_ADDR, address),
        getTokenBalance(MOCK_DAI_ADDR, address),
      ]);
      
      setBalances({
        usdc: {
          balance: usdcBalance.balance,
          formatted: usdcBalance.formatted,
          symbol: usdcBalance.symbol,
        },
        dai: {
          balance: daiBalance.balance,
          formatted: daiBalance.formatted,
          symbol: daiBalance.symbol,
        },
      });
    } catch (error) {
      console.error("Load balances error:", error);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadBalances();
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-lg font-medium mb-2">Connect Wallet Required</h3>
              <p className="text-sm">Please connect your wallet to view your account.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Account</h1>
        <p className="text-gray-600 mt-2">Manage your trades and view your balances</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Wallet Address</h4>
              <div className="font-mono text-sm bg-gray-100 p-3 rounded-lg">
                {address}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Network</h4>
              <Badge variant="info">Sepolia Testnet</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Balances */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Token Balances</CardTitle>
            <Button variant="outline" size="sm" onClick={loadBalances}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">{balances.usdc.symbol}</span>
                <span className="text-2xl font-bold">{balances.usdc.formatted}</span>
              </div>
              <div className="text-sm text-gray-500">
                Raw: {balances.usdc.balance}
              </div>
              <div className="text-xs text-gray-400">
                Address: {shortAddress(MOCK_USDC_ADDR)}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">{balances.dai.symbol}</span>
                <span className="text-2xl font-bold">{balances.dai.formatted}</span>
              </div>
              <div className="text-sm text-gray-500">
                Raw: {balances.dai.balance}
              </div>
              <div className="text-xs text-gray-400">
                Address: {shortAddress(MOCK_DAI_ADDR)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Deals */}
      <Card>
        <CardHeader>
          <CardTitle>My Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium mb-2">No deals found</h3>
            <p className="text-sm">You haven't created or participated in any deals yet.</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button className="h-16" asChild>
              <a href="/p2p/new">Create P2P Deal</a>
            </Button>
            <Button variant="outline" className="h-16" asChild>
              <a href="/marketplace">Browse Marketplace</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
