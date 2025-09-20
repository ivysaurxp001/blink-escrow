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

export default function HomePage() {
  const { getDeal } = useBlindEscrow();
  const [deals, setDeals] = useState<DealInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");

  const checkMetaMaskStatus = async () => {
    try {
      // Check if MetaMask is installed and accessible
      if (!window.ethereum) {
        return { installed: false, unlocked: false, accounts: 0 };
      }

      // Check if MetaMask is unlocked by trying to get accounts
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      console.log('MetaMask accounts check result:', accounts);
      
      return {
        installed: true,
        unlocked: accounts && accounts.length > 0,
        accounts: accounts ? accounts.length : 0,
        accountList: accounts || []
      };
    } catch (error) {
      console.log('MetaMask status check failed:', error);
      // If eth_accounts fails, it might mean MetaMask is locked
      // But we should still try to connect
      return { installed: true, unlocked: false, accounts: 0, error: error };
    }
  };

  const connectWallet = async () => {
    try {
      console.log('Starting wallet connection...');
      
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

      console.log('MetaMask detected, attempting connection...');

      // Try to get accounts first
      let accounts = [];
      try {
        accounts = await window.ethereum.request({ method: 'eth_accounts' });
        console.log('Current accounts:', accounts);
      } catch (accountsError) {
        console.log('Could not get accounts:', accountsError);
      }

      // If we have accounts, use them
      if (accounts && accounts.length > 0) {
        console.log('Using existing accounts...');
        setIsConnected(true);
        setWalletAddress(accounts[0]);
        console.log('Connected to existing wallet:', accounts[0]);
        return;
      }

      // If no accounts, request permission
      console.log('No accounts found, requesting permission...');
      
      // Simple request without timeout
      const newAccounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      console.log('New accounts received:', newAccounts);
      
      if (newAccounts && newAccounts.length > 0) {
        setIsConnected(true);
        setWalletAddress(newAccounts[0]);
        console.log('Successfully connected to wallet:', newAccounts[0]);
      } else {
        throw new Error('No accounts returned from MetaMask');
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      console.error('Error details:', {
        code: error?.code,
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      
      // More specific error messages
      if (error?.code === 4001) {
        alert('Connection rejected by user. Please try again and approve the connection.');
      } else if (error?.code === -32002) {
        alert('Connection request already pending. Please check MetaMask.');
      } else if (error?.code === -32603) {
        alert('Internal JSON-RPC error. Please check your MetaMask network settings.');
      } else if (error?.message?.includes('User denied')) {
        alert('Connection was denied. Please approve the connection in MetaMask.');
      } else if (error?.message?.includes('Already processing')) {
        alert('MetaMask is already processing a request. Please wait and try again.');
      } else if (error?.message?.includes('wallet must has at least one account') || 
                 error?.message?.includes('wallet must have at least one account')) {
        alert('MetaMask wallet has no accounts.\n\nPlease:\n1. Open MetaMask\n2. Create a new account or import an existing one\n3. Make sure MetaMask is unlocked\n4. Try connecting again');
      } else if (error?.message?.includes('timeout')) {
        alert('Connection timeout. Please try again.');
      } else {
        const errorMsg = error?.message || error?.toString() || 'Unknown error occurred';
        alert(`Failed to connect wallet: ${errorMsg}\n\nPlease ensure:\n1. MetaMask is installed and unlocked\n2. You have at least one account in MetaMask\n3. You're on the correct network (Sepolia)\n4. Try refreshing the page`);
      }
    }
  };

  const loadDeals = async () => {
    setLoading(true);
    try {
      const mockDeals: DealInfo[] = [
        {
          id: 1,
          seller: "0x963a2d0BE2eb5d785C6E73ec904fcE8d65691773" as `0x${string}`,
          buyer: "0xd8FF12Afb233f53666a22373e864c3e23DcF7495" as `0x${string}`,
          assetToken: "0x5f3CD01981EFB5C500d20be535C68B980cfFC414" as `0x${string}`,
          assetAmount: BigInt("1000000000"),
          payToken: "0xFaba8eFb5d502baf7Cd3832e0AF95EF84a496738" as `0x${string}`,
          hasAsk: true,
          hasBid: true,
          hasThreshold: true,
          state: DealState.Ready,
        },
        {
          id: 2,
          seller: "0x963a2d0BE2eb5d785C6E73ec904fcE8d65691773" as `0x${string}`,
          buyer: "0xd8FF12Afb233f53666a22373e864c3e23DcF7495" as `0x${string}`,
          assetToken: "0x5f3CD01981EFB5C500d20be535C68B980cfFC414" as `0x${string}`,
          assetAmount: BigInt("555000000"),
          payToken: "0xFaba8eFb5d502baf7Cd3832e0AF95EF84a496738" as `0x${string}`,
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
    checkWalletConnection();
    
    // Add MetaMask event listeners
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('Accounts changed:', accounts);
        if (accounts.length > 0) {
          setIsConnected(true);
          setWalletAddress(accounts[0]);
        } else {
          setIsConnected(false);
          setWalletAddress("");
        }
      };

      const handleChainChanged = (chainId: string) => {
        console.log('Chain changed:', chainId);
        // Optionally handle network changes
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Cleanup
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const checkWalletConnection = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });
        
        console.log('Auto-connect check - accounts:', accounts);
        
        if (accounts && accounts.length > 0) {
          setIsConnected(true);
          setWalletAddress(accounts[0]);
          console.log('Auto-connected to wallet:', accounts[0]);
        } else {
          console.log('No accounts found for auto-connect');
        }
      } else {
        console.log('MetaMask not available for auto-connect');
      }
    } catch (error) {
      console.log('Auto-connect failed:', error);
    }
  };

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
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/10 text-white text-sm font-medium">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Privacy-First Trading
            </div>
          </div>
          
          {/* Connect Wallet Button */}
          <div className="mb-8">
            <WalletButton />
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-8">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Blind Escrow
            </span>
            <br />
            <span className="text-white">Marketplace</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed">
            Trade securely with encrypted prices. No front-running, no intermediaries.
            <br />
            <span className="text-blue-400 font-semibold">Experience the future of decentralized trading.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/p2p/new">
              <Button size="lg" className="group bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-2 transition-all duration-300 px-8 py-4 text-lg font-semibold">
                <svg className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create P2P Deal
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" className="group bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-2 transition-all duration-300 px-8 py-4 text-lg font-semibold">
                <svg className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Marketplace
              </Button>
              </Link>
          </div>
          </div>
          
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="group bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 transform hover:-translate-y-3">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-5xl font-black text-white mb-3 text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{deals.length}</h3>
            <p className="text-gray-300 text-center font-semibold text-lg">Active Deals</p>
          </div>
          
          <div className="group bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 shadow-2xl hover:shadow-green-500/10 transition-all duration-500 transform hover:-translate-y-3">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-5xl font-black text-white mb-3 text-center bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">500+</h3>
            <p className="text-gray-300 text-center font-semibold text-lg">Completed Trades</p>
          </div>
          
          <div className="group bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 transform hover:-translate-y-3">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-5xl font-black text-white mb-3 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">99.9%</h3>
            <p className="text-gray-300 text-center font-semibold text-lg">Success Rate</p>
        </div>
          </div>
          
        {/* Recent Deals Section */}
        <div className="mb-20">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl font-black text-white">Recent Deals</h2>
            <Button 
              onClick={loadDeals}
              disabled={loading}
              className="group bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-xl hover:shadow-blue-500/25 transform hover:-translate-y-1 transition-all duration-300"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refresh
            </Button>
          </div>
          
          {loading ? (
            <div className="grid gap-8 md:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 animate-pulse">
                  <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-white/10 rounded"></div>
                    <div className="h-4 bg-white/10 rounded w-2/3"></div>
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
              ))}
              </div>
          ) : deals.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2">
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} onAction={loadDeals} />
              ))}
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center">
              <div className="text-gray-300">
                <div className="text-6xl mb-6">📋</div>
                <h3 className="text-2xl font-bold mb-4 text-white">No deals available</h3>
                <p className="text-lg mb-8">No open deals found. Create a new P2P deal to get started.</p>
                <Link href="/p2p/new">
                  <Button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-xl hover:shadow-blue-500/25 transform hover:-translate-y-1 transition-all duration-300">
                    Create Your First Deal
                  </Button>
                </Link>
              </div>
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link href="/marketplace">
              <Button className="group bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-xl hover:shadow-blue-500/25 transform hover:-translate-y-1 transition-all duration-300 px-8 py-3">
                View All Deals
                <svg className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
              </div>
            </div>
            
        {/* Features Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-black text-white mb-16 text-center">Why Choose Blind Escrow?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
                title: "Privacy-Preserving",
                description: "Leverage FHEVM to keep your ask and bid prices confidential until a match is found.",
                gradient: "from-blue-500 to-cyan-500",
                textGradient: "from-blue-400 to-cyan-400"
              },
              {
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                title: "No Front-Running",
                description: "Eliminate the risk of front-running with encrypted on-chain computations.",
                gradient: "from-green-500 to-emerald-500",
                textGradient: "from-green-400 to-emerald-400"
              },
              {
                icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                title: "Peer-to-Peer",
                description: "Trade directly with other users without the need for trusted intermediaries.",
                gradient: "from-purple-500 to-pink-500",
                textGradient: "from-purple-400 to-pink-400"
              },
              {
                icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                title: "Secure & Transparent",
                description: "All transactions are secured by smart contracts and verifiable on the blockchain.",
                gradient: "from-orange-500 to-red-500",
                textGradient: "from-orange-400 to-red-400"
              },
              {
                icon: "M13 10V3L4 14h7v7l9-11h-7z",
                title: "Instant Settlement",
                description: "Automated settlement when prices match within the specified threshold.",
                gradient: "from-pink-500 to-rose-500",
                textGradient: "from-pink-400 to-rose-400"
              },
              {
                icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1",
                title: "Fair Pricing",
                description: "No hidden fees or spreads. Pay only what you agree to in the encrypted deal.",
                gradient: "from-indigo-500 to-blue-500",
                textGradient: "from-indigo-400 to-blue-400"
              }
            ].map((feature, index) => (
              <div key={index} className="group bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 transform hover:-translate-y-3">
                <div className={`flex items-center justify-center w-20 h-20 bg-gradient-to-r ${feature.gradient} rounded-3xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <h3 className={`text-2xl font-black text-white mb-4 bg-gradient-to-r ${feature.textGradient} bg-clip-text text-transparent`}>
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed text-lg">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}