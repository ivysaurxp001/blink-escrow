"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
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

export default function NewP2PDealPage() {
  const [formData, setFormData] = useState({
    buyerAddress: "",
    assetAmount: "",
    assetToken: "0x5f3CD01981EFB5C500d20be535C68B980cfFC414", // MockUSDC
    payToken: "0xFaba8eFb5d502baf7Cd3832e0AF95EF84a496738", // MockDAI
  });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement deal creation
    console.log("Creating deal with:", formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      
      <div className="relative max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <Link href="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-300">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Marketplace
            </Link>
            <WalletButton />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mt-6 mb-4">
            Create New <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">P2P Deal</span>
          </h1>
          <p className="text-xl text-gray-300">
            Create a private deal with encrypted pricing
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white mb-2">Deal Configuration</h2>
            <p className="text-gray-400">Configure your private trading deal</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Buyer Address
              </label>
              <Input
                type="text"
                placeholder="0x..."
                value={formData.buyerAddress}
                onChange={(e) => handleInputChange("buyerAddress", e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-2">
                The address of the buyer for this deal
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Asset Amount
              </label>
              <Input
                type="number"
                placeholder="1000"
                value={formData.assetAmount}
                onChange={(e) => handleInputChange("assetAmount", e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-2">
                Amount of asset tokens to trade (in smallest units)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Asset Token
                </label>
                <Input
                  type="text"
                  value={formData.assetToken}
                  onChange={(e) => handleInputChange("assetToken", e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-2">MockUSDC</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Payment Token
                </label>
                <Input
                  type="text"
                  value={formData.payToken}
                  onChange={(e) => handleInputChange("payToken", e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-2">MockDAI</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
              <h3 className="font-bold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Next Steps
              </h3>
              <ol className="text-sm text-gray-300 space-y-2">
                <li className="flex items-center">
                  <span className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-xs font-bold mr-3">1</span>
                  Approve asset token for the escrow contract
                </li>
                <li className="flex items-center">
                  <span className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-xs font-bold mr-3">2</span>
                  Create the deal (no relayer needed!)
                </li>
                <li className="flex items-center">
                  <span className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-xs font-bold mr-3">3</span>
                  Set encrypted threshold and ask price
                </li>
                <li className="flex items-center">
                  <span className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-xs font-bold mr-3">4</span>
                  Wait for buyer to submit bid
                </li>
                <li className="flex items-center">
                  <span className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-xs font-bold mr-3">5</span>
                  Reveal and settle the deal
                </li>
              </ol>
            </div>

            <div className="flex gap-4">
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-xl hover:shadow-blue-500/25 transform hover:-translate-y-1 transition-all duration-300 py-3"
              >
                Create Deal
              </Button>
              <Link href="/">
                <Button 
                  type="button" 
                  className="border-2 border-white/20 hover:border-white/40 hover:bg-white/10 text-white backdrop-blur-sm shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 py-3 px-6"
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-xl font-black text-white mb-2">Current Configuration</h3>
              <p className="text-gray-400">Preview of your deal settings</p>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-gray-300 font-medium">Asset Token:</span>
                <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{formData.assetToken}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-gray-300 font-medium">Payment Token:</span>
                <span className="font-mono text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded">{formData.payToken}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-gray-300 font-medium">Asset Amount:</span>
                <span className="text-white font-semibold">{formData.assetAmount || "Not set"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-300 font-medium">Buyer:</span>
                <span className="font-mono text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
                  {formData.buyerAddress || "Not set"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}