"use client";

import { useState } from "react";
import DealCard from "../../src/components/DealCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useDealsQuery } from "../../src/hooks/useDealsQuery";
import { useBlindEscrow } from "../../src/hooks/useBlindEscrow";
import { DealInfo, DealState } from "@/lib/types";
import WalletButton from "@/components/WalletButton";
import { useAccount } from 'wagmi';
import SimpleFHE from "../../src/components/SimpleFHE";
import FHETest from "../../src/components/FHETest";
import Logo from "../../src/components/Logo";
import Link from "next/link";
import { MOCK_TOKENS } from "@/abi/MockTokenAddresses";

export default function MarketplacePage() {
  const { address } = useAccount();
  const [currentPage, setCurrentPage] = useState(1);
  const dealsPerPage = 6;
  
  // Fetch deals with pagination
  const { openDeals, loading, error, totalDeals, refetch } = useDealsQuery({ 
    limit: dealsPerPage,
    offset: (currentPage - 1) * dealsPerPage
  });
  
  // Fetch all deals for stats (no pagination, newest first)
  const { openDeals: allDeals, loading: statsLoading, refetch: refetchStats } = useDealsQuery({ 
    limit: 1000, // Get all deals for stats
    offset: 0
  });
  
  // Debug pagination
  console.log('🔍 Pagination debug:', {
    currentPage,
    dealsPerPage,
    offset: (currentPage - 1) * dealsPerPage,
    totalDeals,
    dealsCount: openDeals.length,
    allDealsCount: allDeals.length,
    openDeals: openDeals.map(d => ({ id: d.id, seller: d.seller, mode: d.mode, state: d.state }))
  });
  const { createOpenWithAskThreshold } = useBlindEscrow();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [formData, setFormData] = useState({
    assetAmount: "",
    assetToken: MOCK_TOKENS.MOCK_USDC, // Z-USDC
    payToken: MOCK_TOKENS.MOCK_DAI, // Z-DAI
    askAmount: "",
    threshold: "",
  });

  const handleCreateOpenDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateSuccess(false);
    setCurrentStep("Preparing transaction...");
    
    try {
      console.log("🔍 Form data before creating deal:", formData);
      console.log("🔍 Asset amount as BigInt:", BigInt(formData.assetAmount));
      console.log("🔍 Ask amount:", formData.askAmount);
      console.log("🔍 Threshold:", formData.threshold);
      
      setCurrentStep("Step 1: Approving asset token...");
      const result = await createOpenWithAskThreshold({
        assetToken: formData.assetToken as `0x${string}`,
        assetAmount: BigInt(formData.assetAmount),
        payToken: formData.payToken as `0x${string}`,
        askAmount: parseFloat(formData.askAmount),
        threshold: parseFloat(formData.threshold),
      });
      
      if (result) {
        setCurrentStep("Deal created successfully!");
        console.log("✅ Deal created successfully with transaction:", result.transactionHash);
      } else {
        setCurrentStep("Deal creation failed");
      }
      setCreateSuccess(true);
      setFormData({ 
        assetAmount: "",
        assetToken: MOCK_TOKENS.MOCK_USDC,
        payToken: MOCK_TOKENS.MOCK_DAI,
        askAmount: "",
        threshold: "",
      }); // Reset form
      
      // Hide form after 3 seconds
      setTimeout(() => {
        setShowCreateForm(false);
        setCreateSuccess(false);
        setCurrentStep("");
      }, 3000);
      
      // Also refresh after a short delay to ensure blockchain state is updated
      setTimeout(async () => {
        console.log("🔄 Delayed refresh to ensure blockchain state is updated...");
        await refetch();
        await refetchStats();
      }, 2000);
      
      // Force refresh one more time after 5 seconds
      setTimeout(async () => {
        console.log("🔄 Final refresh to ensure deal is visible...");
        await refetch();
        await refetchStats();
      }, 5000);
      
      // Reset to page 1 to show newest deals
      setCurrentPage(1);
      
      // Refresh both paginated deals and stats
      console.log("🔄 Refreshing deals after creation...");
      await refetch();
      await refetchStats();
      console.log("✅ Deals refreshed successfully");
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
          <div className="flex items-center space-x-4 mt-6 mb-4">
            <Logo size="md" />
            <h1 className="text-4xl md:text-5xl font-black text-white">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Marketplace</span>
            </h1>
          </div>
          <p className="text-xl text-gray-300">
            Discover and participate in open trading deals
          </p>
        </div>

        {/* FHE Test Component - Hidden for now */}
        {/* <SimpleFHE />
        <FHETest /> */}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Open Deals</p>
                  <p className="text-2xl font-bold text-white">{statsLoading ? '...' : allDeals.length}</p>
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
                  <p className="text-sm font-medium text-gray-400">Total Deals</p>
                  <p className="text-2xl font-bold text-white">{statsLoading ? '...' : allDeals.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Settled Deals</p>
                  <p className="text-2xl font-bold text-white">{statsLoading ? '...' : allDeals.filter(deal => deal.state === DealState.Settled).length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {openDeals.map((deal: DealInfo) => (
                <DealCard 
                  key={deal.id} 
                  deal={deal} 
                  onAction={refetch}
                />
              ))}
            </div>
            
            {/* Pagination */}
            {totalDeals > dealsPerPage && (
              <div className="mt-8 flex justify-center items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {Math.ceil(totalDeals / dealsPerPage)}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalDeals / dealsPerPage), prev + 1))}
                  disabled={currentPage >= Math.ceil(totalDeals / dealsPerPage)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}