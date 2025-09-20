"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useBlindEscrow } from "@/hooks/useBlindEscrow";
import { useAccount } from "wagmi";
import { MOCK_USDC_ADDR, MOCK_DAI_ADDR } from "@/config/contracts";
import { parseUnits } from "viem";

export default function NewP2PPage() {
  const router = useRouter();
  const { createP2P } = useBlindEscrow();
  const { address, isConnected } = useAccount();
  
  const [buyer, setBuyer] = useState("");
  const [assetAmount, setAssetAmount] = useState("1000");
  const [loading, setLoading] = useState(false);

  // Fixed addresses for demo
  const assetToken = MOCK_USDC_ADDR;
  const payToken = MOCK_DAI_ADDR;

  const handleCreateDeal = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!buyer) {
      alert("Please enter buyer address");
      return;
    }

    if (!assetAmount || Number(assetAmount) <= 0) {
      alert("Please enter valid asset amount");
      return;
    }

    setLoading(true);
    try {
      // Convert to raw units (USDC has 6 decimals)
      const assetAmountRaw = parseUnits(assetAmount, 6);
      
      const dealId = await createP2P(
        buyer as `0x${string}`,
        assetToken as `0x${string}`,
        assetAmountRaw,
        payToken as `0x${string}`
      );
      
      alert(`Deal created successfully! Deal ID: ${dealId}`);
      router.push(`/deals/${dealId}`);
    } catch (error) {
      console.error("Create deal error:", error);
      alert("Failed to create deal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-lg font-medium mb-2">Connect Wallet Required</h3>
              <p className="text-sm">Please connect your wallet to create a P2P deal.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create P2P Deal</h1>
        <p className="text-gray-600 mt-2">Create a private deal with a specific buyer</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Buyer Address"
            placeholder="0x..."
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
          />
          
          <Input
            label="Asset Amount (USDC)"
            type="number"
            placeholder="1000"
            value={assetAmount}
            onChange={(e) => setAssetAmount(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Asset Token:</span>
              <br />
              <span className="font-mono text-xs">{assetToken}</span>
            </div>
            <div>
              <span className="font-medium">Payment Token:</span>
              <br />
              <span className="font-mono text-xs">{payToken}</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">⚠️ Important Notes:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• You need to approve USDC tokens before creating the deal</li>
              <li>• The buyer will need to approve DAI tokens before settling</li>
              <li>• Asset amount is in USDC (6 decimals)</li>
              <li>• Payment will be in DAI (18 decimals)</li>
            </ul>
          </div>

          <Button 
            onClick={handleCreateDeal} 
            loading={loading}
            className="w-full"
            disabled={!buyer || !assetAmount}
          >
            {loading ? "Creating Deal..." : "Create P2P Deal"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</div>
              <div>
                <span className="font-medium">Approve USDC</span>
                <p className="text-gray-600">Approve {assetAmount} USDC for the escrow contract</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</div>
              <div>
                <span className="font-medium">Create Deal</span>
                <p className="text-gray-600">Create the P2P deal with the specified buyer</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</div>
              <div>
                <span className="font-medium">Submit Ask + Threshold</span>
                <p className="text-gray-600">Set your ask price and threshold for price matching</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</div>
              <div>
                <span className="font-medium">Wait for Buyer</span>
                <p className="text-gray-600">Buyer will submit their bid price</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
