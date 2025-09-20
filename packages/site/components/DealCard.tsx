"use client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

interface DealInfo {
  id: number;
  seller: string;
  buyer: string;
  assetToken: string;
  assetAmount: bigint;
  payToken: string;
  hasAsk: boolean;
  hasBid: boolean;
  hasThreshold: boolean;
  state: number;
}

interface DealCardProps {
  deal: DealInfo;
  onAction?: () => void;
}

export default function DealCard({ deal, onAction }: DealCardProps) {
  const getStateColor = (state: number) => {
    const colors = {
      0: "bg-gray-100 text-gray-800", // None
      1: "bg-blue-100 text-blue-800", // Created
      2: "bg-yellow-100 text-yellow-800", // A_Submitted
      3: "bg-orange-100 text-orange-800", // B_Submitted
      4: "bg-green-100 text-green-800", // Ready
      5: "bg-emerald-100 text-emerald-800", // Settled
      6: "bg-red-100 text-red-800", // Canceled
    };
    return colors[state as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const formatDealState = (state: number) => {
    const states = ["None", "Created", "A_Submitted", "B_Submitted", "Ready", "Settled", "Canceled"];
    return states[state] || "Unknown";
  };

  const shortAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="group bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 transform hover:-translate-y-2">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-2xl font-black text-white">Deal #{deal.id}</h3>
        <Badge className={`${getStateColor(deal.state)} backdrop-blur-sm border border-white/20`}>
          {formatDealState(deal.state)}
        </Badge>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <span className="font-semibold text-gray-300">Seller:</span>
            <br />
            <span className="font-mono text-xs text-blue-400">{shortAddress(deal.seller)}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-300">Buyer:</span>
            <br />
            <span className="font-mono text-xs text-purple-400">{shortAddress(deal.buyer)}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-300">Asset:</span>
            <br />
            <span className="font-mono text-xs text-green-400">{shortAddress(deal.assetToken)}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-300">Payment:</span>
            <br />
            <span className="font-mono text-xs text-orange-400">{shortAddress(deal.payToken)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-300">Status:</span>
          <div className="flex gap-2">
            {deal.hasAsk && <Badge variant="success" size="sm" className="bg-green-500/20 text-green-400 border border-green-500/30">Ask</Badge>}
            {deal.hasBid && <Badge variant="info" size="sm" className="bg-blue-500/20 text-blue-400 border border-blue-500/30">Bid</Badge>}
            {deal.hasThreshold && <Badge variant="warning" size="sm" className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Threshold</Badge>}
          </div>
        </div>

        <div className="text-center py-4">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Connect wallet to interact
          </div>
        </div>
      </div>
    </div>
  );
}
