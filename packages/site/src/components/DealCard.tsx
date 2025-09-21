"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DealInfo, DealState, DealMode } from "@/lib/types";
import { useBlindEscrow } from "../hooks/useBlindEscrow";
import { useRole } from "../hooks/useRole";
import { formatDealState, getStateColor, shortAddress } from "@/lib/format";
import { DEAL_STATE_LABELS } from "@/config/constants";
import { useRef, useEffect } from "react";

interface DealCardProps {
  deal: DealInfo;
  onAction?: () => void;
}

export default function DealCard({ deal, onAction }: DealCardProps) {
  const { address, submitAskWithThreshold, submitBid, revealMatch, settle } = useBlindEscrow();
  const { isSeller, isBuyer, isGuest, isPotentialBuyer } = useRole(deal);

  // Debug logging with useRef to avoid spam
  const logged = useRef(false);
  useEffect(() => {
    if (!logged.current) {
      console.log(`🔍 Deal ${deal.id} debug:`, {
        address,
        isSeller,
        isBuyer,
        isGuest,
        isPotentialBuyer,
        dealMode: deal.mode,
        dealBuyer: deal.buyer,
        dealSeller: deal.seller
      });
      logged.current = true;
    }
  }, [deal.id, address, isSeller, isBuyer, isGuest, isPotentialBuyer, deal.mode, deal.buyer, deal.seller]);

  const Zero = "0x0000000000000000000000000000000000000000";
  const isOpenDeal = deal.mode === DealMode.OPEN;
  const hasNoBuyer = deal.buyer === Zero;
  const canBecomeBuyer = isPotentialBuyer || (isOpenDeal && hasNoBuyer && address && !isSeller);

  const canSubmitAsk = isSeller && (deal.state === DealState.Created || deal.state === DealState.B_Submitted);
  const canSubmitBid = isBuyer && (deal.state === DealState.Created || deal.state === DealState.A_Submitted);
  const canReveal = (isSeller || isBuyer) && deal.state === DealState.Ready;
  const canSettle = (isSeller || isBuyer) && deal.state === DealState.Ready;

  const handleSubmitAsk = async () => {
    try {
      const askAmount = prompt("Enter your ask amount (in DAI):", "1000");
      if (!askAmount || isNaN(Number(askAmount))) {
        alert("Please enter a valid ask amount");
        return;
      }
      const threshold = prompt("Enter threshold (in DAI):", "100");
      if (!threshold || isNaN(Number(threshold))) {
        alert("Please enter a valid threshold");
        return;
      }
      await submitAskWithThreshold(deal.id, Number(askAmount), Number(threshold));
      onAction?.();
    } catch (error) {
      console.error("Submit ask error:", error);
    }
  };

  const handleSubmitBid = async () => {
    try {
      const bidAmount = prompt("Enter your bid amount (in DAI):", "990");
      if (!bidAmount || isNaN(Number(bidAmount))) {
        alert("Please enter a valid bid amount");
        return;
      }
      await submitBid(deal.id, Number(bidAmount));
      onAction?.();
    } catch (error) {
      console.error("Submit bid error:", error);
    }
  };

  const handleBecomeBuyer = async () => {
    try {
      const bidAmount = prompt("Enter your bid amount (in DAI):", "990");
      if (!bidAmount || isNaN(Number(bidAmount))) {
        alert("Please enter a valid bid amount");
        return;
      }
      await submitBid(deal.id, Number(bidAmount)); // This will lock buyer
      onAction?.();
    } catch (error) {
      console.error("Become buyer error:", error);
    }
  };

  const handleRevealAndBind = async () => {
    try {
      const result = await revealMatch(deal.id);
      console.log("Reveal result:", result);
      onAction?.();
    } catch (error) {
      console.error("Reveal error:", error);
    }
  };

  const handleSettle = async () => {
    try {
      const result = await revealMatch(deal.id);
      await settle(deal.id, result.askClear, result.bidClear);
      onAction?.();
    } catch (error) {
      console.error("Settle error:", error);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Deal #{deal.id}</CardTitle>
            {isOpenDeal && (
              <Badge variant="info" className="mt-1">
                {hasNoBuyer ? "OPEN - No Buyer" : "OPEN - Buyer Locked"}
              </Badge>
            )}
          </div>
          <Badge className={getStateColor(deal.state)}>
            {DEAL_STATE_LABELS[deal.state]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Seller:</span>
            <br />
            <span className="font-mono text-xs">{shortAddress(deal.seller)}</span>
          </div>
          <div>
            <span className="font-medium">Buyer:</span>
            <br />
            <span className="font-mono text-xs">
              {hasNoBuyer ? "Not assigned" : shortAddress(deal.buyer)}
            </span>
          </div>
          <div>
            <span className="font-medium">Asset:</span>
            <br />
            <span className="font-mono text-xs">{shortAddress(deal.assetToken)}</span>
          </div>
          <div>
            <span className="font-medium">Payment:</span>
            <br />
            <span className="font-mono text-xs">{shortAddress(deal.payToken)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Status:</span>
          <div className="flex gap-1">
            {deal.hasAsk && <Badge variant="success" size="sm">Ask</Badge>}
            {deal.hasBid && <Badge variant="info" size="sm">Bid</Badge>}
            {deal.hasThreshold && <Badge variant="warning" size="sm">Threshold</Badge>}
          </div>
        </div>

        {!isGuest && (
          <div className="flex gap-2 flex-wrap">
            {canSubmitAsk && (
              <Button onClick={handleSubmitAsk} size="sm">
                Submit Ask + Threshold
              </Button>
            )}

            {canSubmitBid && (
              <Button onClick={handleSubmitBid} size="sm" variant="outline">
                Submit Bid
              </Button>
            )}

            {canReveal && (
              <Button onClick={handleRevealAndBind} size="sm" variant="outline">
                Reveal & Bind
              </Button>
            )}

            {canSettle && (
              <Button onClick={handleSettle} size="sm" variant="default">
                Settle
              </Button>
            )}
          </div>
        )}

        {/* Show status message when no actions available */}
        {!isGuest && !canSubmitAsk && !canSubmitBid && !canReveal && !canSettle && (
          <div className="text-sm text-gray-400 bg-gray-800/50 p-3 rounded-lg">
            {isBuyer && deal.state === DealState.B_Submitted && (
              <p>✅ Your bid has been submitted! Waiting for seller to submit ask + threshold...</p>
            )}
            {isSeller && deal.state === DealState.A_Submitted && (
              <p>✅ Your ask has been submitted! Waiting for buyer to submit bid...</p>
            )}
            {deal.state === DealState.Ready && (
              <p>🎯 Deal is ready! Both parties can now reveal and settle.</p>
            )}
          </div>
        )}

        {canBecomeBuyer && (
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleBecomeBuyer} 
              size="sm" 
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
            >
              Become Buyer & Submit Bid
            </Button>
          </div>
        )}

        {isGuest && !canBecomeBuyer && !address && (
          <div className="text-sm text-gray-500 text-center py-2">
            Connect wallet to interact with this deal
          </div>
        )}
        
        {isGuest && !canBecomeBuyer && address && (
          <div className="text-sm text-gray-500 text-center py-2">
            You are not a participant in this deal
          </div>
        )}

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-800 rounded">
            Debug: isGuest={isGuest.toString()}, canBecomeBuyer={canBecomeBuyer?.toString() || 'false'}, address={address ? 'connected' : 'not connected'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
