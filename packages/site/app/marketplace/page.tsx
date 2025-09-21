"use client";

import { useState } from "react";
import DealCard from "../../src/components/DealCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useDealsQuery } from "../../src/hooks/useDealsQuery";
import { useBlindEscrow } from "../../src/hooks/useBlindEscrow";
import { DealInfo } from "@/lib/types";
import WalletButton from "@/components/WalletButton";
import SimpleFHE from "../../src/components/SimpleFHE";
import FHETest from "../../src/components/FHETest";
import Link from "next/link";

export default function MarketplacePage() {
  const { openDeals, loading, error, refetch } = useDealsQuery();
  const { createOpenWithAsk } = useBlindEscrow();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [formData, setFormData] = useState({
    assetAmount: "",
    assetToken: "0x5f3CD01981EFB5C500d20be535C68B980cfFC414", // MockUSDC
    payToken: "0xFaba8eFb5d502baf7Cd3832e0AF95EF84a496738", // MockDAI
    askAmount: "",
    threshold: "",
  });

  const handleCreateOpenDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateSuccess(false);
    setCurrentStep("Preparing transaction...");
    
    try {
      setCurrentStep("Step 1: Approving asset token...");
      const result = await createOpenWithAsk({
        assetToken: formData.assetToken as `0x${string}`,
        assetAmount: BigInt(formData.assetAmount),
        payToken: formData.payToken as `0x${string}`,
        askAmount: parseFloat(formData.askAmount),
        threshold: parseFloat(formData.threshold),
      });
      
      if (result.fallback) {
        setCurrentStep("Deal created (ask/threshold will be submitted later when relayer is ready)");
      } else {
        setCurrentStep("Deal created successfully!");
      }
      console.log("✅ Deal created successfully with ID:", result.dealId);
      setCreateSuccess(true);
      setFormData({ 
        assetAmount: "",
        assetToken: "0x5f3CD01981EFB5C500d20be535C68B980cfFC414",
        payToken: "0xFaba8eFb5d502baf7Cd3832e0AF95EF84a496738",
        askAmount: "",
        threshold: "",
      }); // Reset form
      
      // Hide form after 3 seconds
      setTimeout(() => {
        setShowCreateForm(false);
        setCreateSuccess(false);
        setCurrentStep("");
      }, 3000);
      
      refetch();
    } catch (error) {
      console.error("❌ Create open deal error:", error);
      setCurrentStep("Transaction failed. Please try again.");
      alert(`Failed to create deal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
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
      
      <div className="relative max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
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
            Discover and participate in open trading deals
          </p>
        </div>

        {/* FHE Test Component */}
        <SimpleFHE />
        <FHETest />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Open Deals</p>
                  <p className="text-2xl font-bold text-white">{openDeals.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Volume</p>
                  <p className="text-2xl font-bold text-white">$0</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-xl hover:shadow-blue-500/25 transform hover:-translate-y-1 transition-all duration-300"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Open Deal
          </Button>
          
          <Button 
            onClick={refetch}
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-xl hover:shadow-blue-500/25 transform hover:-translate-y-1 transition-all duration-300"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>

        {/* Create Open Deal Form */}
        {showCreateForm && (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Create Open Deal</CardTitle>
            </CardHeader>
            <CardContent>
              {createSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Deal Created Successfully!</h3>
                  <p className="text-gray-400">Your open deal is now available in the marketplace.</p>
                </div>
              ) : (
                <form onSubmit={handleCreateOpenDeal} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Asset Amount
                    </label>
                    <input
                      type="number"
                      placeholder="1000"
                      value={formData.assetAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, assetAmount: e.target.value }))}
                      required
                      disabled={isCreating}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ask Amount (DAI)
                    </label>
                    <input
                      type="number"
                      placeholder="1000"
                      value={formData.askAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, askAmount: e.target.value }))}
                      required
                      disabled={isCreating}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Threshold (DAI)
                    </label>
                    <input
                      type="number"
                      placeholder="100"
                      value={formData.threshold}
                      onChange={(e) => setFormData(prev => ({ ...prev, threshold: e.target.value }))}
                      required
                      disabled={isCreating}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  
                  {isCreating && currentStep && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <div>
                          <p className="text-blue-400 font-medium">{currentStep}</p>
                          <p className="text-blue-300 text-sm">Please sign the transaction in MetaMask</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    <Button 
                      type="submit" 
                      disabled={isCreating}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {currentStep || "Creating..."}
                        </>
                      ) : (
                        "Create Deal"
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => setShowCreateForm(false)}
                      disabled={isCreating}
                      className="border border-white/20 hover:border-white/40 hover:bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {/* Deals Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-gray-400 mt-4">Loading deals...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">Error: {error}</p>
            <Button onClick={refetch} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : openDeals.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Open Deals</h3>
            <p className="text-gray-400 mb-6">Be the first to create an open deal!</p>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-xl hover:shadow-blue-500/25 transform hover:-translate-y-1 transition-all duration-300"
            >
              Create Your First Deal
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {openDeals.map((deal: DealInfo) => (
              <DealCard 
                key={deal.id} 
                deal={deal} 
                onAction={refetch}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}