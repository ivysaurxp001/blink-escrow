"use client";
import { useState, useEffect } from "react";
import DealCard from "@/components/DealCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DealInfo, DealState } from "@/lib/types";
import { useBlindEscrow } from "@/hooks/useBlindEscrow";
import { useAccount } from "wagmi";
import Link from "next/link";
import { MOCK_TOKENS } from "@/abi/MockTokenAddresses";

export default function HomePage() {
  const { getDeal } = useBlindEscrow();
  const { isConnected } = useAccount();
  const [deals, setDeals] = useState<DealInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDeals = async () => {
    setLoading(true);
    try {
      // Mock data for now - in real implementation, fetch from contract events
      const mockDeals: DealInfo[] = [
        {
          id: 1,
          seller: "0x963a2d0BE2eb5d785C6E73ec904fcE8d65691773" as `0x${string}`,
          buyer: "0xd8FF12Afb233f53666a22373e864c3e23DcF7495" as `0x${string}`,
          assetToken: MOCK_TOKENS.MOCK_USDC as `0x${string}`,
          assetAmount: BigInt("1000000000"), // 1000 USDC (6 decimals)
          payToken: MOCK_TOKENS.MOCK_DAI as `0x${string}`,
          hasAsk: true,
          hasBid: true,
          hasThreshold: true,
          state: DealState.Ready,
        },
        {
          id: 2,
          seller: "0x963a2d0BE2eb5d785C6E73ec904fcE8d65691773" as `0x${string}`,
          buyer: "0xd8FF12Afb233f53666a22373e864c3e23DcF7495" as `0x${string}`,
          assetToken: MOCK_TOKENS.MOCK_USDC as `0x${string}`,
          assetAmount: BigInt("555000000"), // 555 USDC (6 decimals)
          payToken: MOCK_TOKENS.MOCK_DAI as `0x${string}`,
          hasAsk: false,
          hasBid: false,
          hasThreshold: false,
          state: DealState.Created,
        },
      ];
      setDeals(mockDeals);
    } catch (error) {
      console.error("Load deals error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Blind Escrow Marketplace
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Trade securely with encrypted prices. No front-running, no intermediaries.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600">{deals.length}</div>
              <div className="text-sm text-gray-600">Active Deals</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">2</div>
              <div className="text-sm text-gray-600">Completed Trades</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Link href="/p2p/new">
            <Button size="lg" className="px-8">
              Create P2P Deal
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="px-8">
            Browse Marketplace
          </Button>
        </div>

        {/* Recent Deals */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Recent Deals</h2>
            <Button variant="outline" onClick={loadDeals} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : deals.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} onAction={loadDeals} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-gray-500">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-lg font-medium mb-2">No deals available</h3>
                  <p className="text-sm">No open deals found. Create a new P2P deal to get started.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Features */}
        <div className="mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">Why Choose Blind Escrow?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl mb-4">🔒</div>
                  <h3 className="font-semibold mb-2">Encrypted Prices</h3>
                  <p className="text-sm text-gray-600">
                    Prices are encrypted until reveal, preventing front-running and ensuring fair trading.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">🤝</div>
                  <h3 className="font-semibold mb-2">P2P Trading</h3>
                  <p className="text-sm text-gray-600">
                    Direct peer-to-peer trading with no intermediaries or centralized order books.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="font-semibold mb-2">Instant Settlement</h3>
                  <p className="text-sm text-gray-600">
                    Automated settlement when prices match within the specified threshold.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
