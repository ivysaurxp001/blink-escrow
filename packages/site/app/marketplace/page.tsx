"use client";

import { useState, useEffect } from "react";
import DealCard from "@/components/DealCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DealInfo, DealState } from "@/lib/types";
import { useBlindEscrow } from "@/hooks/useBlindEscrow";
import WalletButton from "@/components/WalletButton";
import Link from "next/link";

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

export default function MarketplacePage() {
  const { getDeal } = useBlindEscrow();
  const [deals, setDeals] = useState<DealInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");

  const connectWallet = async () => {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        alert('Please open this page in a browser to connect your wallet.');
        return;
      }

      // Check if MetaMask is installed
      if (!window.ethereum) {
        alert('MetaMask is not installed. Please install MetaMask extension to connect your wallet.');
        return;
      }

      // Check if MetaMask is unlocked
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });

      if (accounts.length === 0) {
        // Request account access
        const newAccounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        if (newAccounts.length > 0) {
          setIsConnected(true);
          setWalletAddress(newAccounts[0]);
          console.log('Connected to wallet:', newAccounts[0]);
        }
      } else {
        // Already connected
        setIsConnected(true);
        setWalletAddress(accounts[0]);
        console.log('Already connected to wallet:', accounts[0]);
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      
      // More specific error messages
      if (error.code === 4001) {
        alert('Connection rejected by user. Please try again and approve the connection.');
      } else if (error.code === -32002) {
        alert('Connection request already pending. Please check MetaMask.');
      } else {
        alert(`Failed to connect wallet: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const loadDeals = async () => {
    setLoading(true);
    try {
      // Mock data - in real app, fetch from contract
      const mockDeals: DealInfo[] = [
        {
          id: 1,
          seller: "0x963a2d0BE2eb5d785C6E73ec904fcE8d65691773",
          buyer: "0xd8FF12Afb233f53666a22373e864c3e23DcF7495",
          assetToken: "0x5f3CD01981EFB5C500d20be535C68B980cfFC414",
          assetAmount: BigInt("1000000000"),
          payToken: "0xFaba8eFb5d502baf7Cd3832e0AF95EF84a496738",
          hasAsk: true,
          hasBid: true,
          hasThreshold: true,
          state: DealState.Ready,
        },
        {
          id: 2,
          seller: "0x1234567890123456789012345678901234567890",
          buyer: "0x0987654321098765432109876543210987654321",
          assetToken: "0x5f3CD01981EFB5C500d20be535C68B980cfFC414",
          assetAmount: BigInt("500000000"),
          payToken: "0xFaba8eFb5d502baf7Cd3832e0AF95EF84a496738",
          hasAsk: true,
          hasBid: false,
          hasThreshold: true,
          state: DealState.A_Submitted,
        },
      ];
      setDeals(mockDeals);
    } catch (error) {
      console.error("Failed to load deals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      
      <div className="relative max-w-6xl mx-auto px-4 py-12">
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <Link href="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-300">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
            <WalletButton />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mt-6 mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Marketplace</span>
          </h1>
          <p className="text-xl text-gray-300">
            Browse and participate in blind escrow deals
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
          <div className="flex flex-wrap gap-3">
            <Button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-xl hover:shadow-blue-500/25 transform hover:-translate-y-1 transition-all duration-300">
              All Deals
            </Button>
            <Button className="border-2 border-white/20 hover:border-white/40 hover:bg-white/10 text-white backdrop-blur-sm shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
              Ready
            </Button>
            <Button className="border-2 border-white/20 hover:border-white/40 hover:bg-white/10 text-white backdrop-blur-sm shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
              Created
            </Button>
          </div>
          <Link href="/p2p/new">
            <Button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-xl hover:shadow-blue-500/25 transform hover:-translate-y-1 transition-all duration-300">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Deal
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-6"></div>
            <p className="text-gray-300 text-lg">Loading deals...</p>
          </div>
        ) : deals.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center shadow-2xl">
            <div className="text-gray-300">
              <div className="text-6xl mb-6">📋</div>
              <h3 className="text-2xl font-bold mb-4 text-white">No deals found</h3>
              <p className="text-lg mb-8">Be the first to create a deal in the marketplace</p>
              <Link href="/p2p/new">
                <Button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-xl hover:shadow-blue-500/25 transform hover:-translate-y-1 transition-all duration-300">
                  Create Deal
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}

        <div className="mt-20">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 shadow-2xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-white mb-4">How It Works</h2>
              <p className="text-gray-300 text-lg">Simple steps to start trading</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-black text-2xl">1</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Create Deal</h3>
                <p className="text-gray-300 leading-relaxed">
                  Sellers create deals with encrypted pricing
                </p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-black text-2xl">2</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Submit Bids</h3>
                <p className="text-gray-300 leading-relaxed">
                  Buyers submit encrypted bids
                </p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-black text-2xl">3</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Reveal & Settle</h3>
                <p className="text-gray-300 leading-relaxed">
                  Matched deals are revealed and settled
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}