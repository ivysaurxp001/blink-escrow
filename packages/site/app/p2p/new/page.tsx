"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import WalletButton from "@/components/WalletButton";
import Link from "next/link";
import { useBlindEscrow } from "../../../src/hooks/useBlindEscrow";
import { MOCK_USDC_ADDR, MOCK_DAI_ADDR } from "@/config/contracts";

export default function NewP2PDealPage() {
  const { createDeal } = useBlindEscrow();
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  
  const [formData, setFormData] = useState({
    buyerAddress: "",
    assetAmount: "",
    assetToken: MOCK_USDC_ADDR, // Use new MockUSDC address
    payToken: MOCK_DAI_ADDR, // Use new MockDAI address
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCurrentStep("Creating P2P deal...");
    
    try {
      console.log("Creating P2P deal with:", formData);
      
      const dealId = await createDeal({
        buyer: formData.buyerAddress,
        assetToken: formData.assetToken,
        assetAmount: BigInt(formData.assetAmount),
        payToken: formData.payToken,
      });
      
      console.log("✅ P2P deal created successfully with ID:", dealId);
      setCurrentStep("Deal created successfully!");
      
      // Reset form
      setFormData({
        buyerAddress: "",
        assetAmount: "",
        assetToken: MOCK_USDC_ADDR,
        payToken: MOCK_DAI_ADDR,
      });
      
      // Auto-hide success message
      setTimeout(() => {
        setCurrentStep("");
      }, 3000);
      
    } catch (error) {
      console.error("❌ Failed to create P2P deal:", error);
      setCurrentStep("Failed to create deal. Please try again.");
      alert(`Failed to create deal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
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

            {currentStep && (
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
                className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-xl hover:shadow-blue-500/25 transform hover:-translate-y-1 transition-all duration-300 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
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