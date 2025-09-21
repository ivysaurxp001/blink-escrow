"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DealInfo, DealState, DealMode } from "@/lib/types";
import { useBlindEscrow } from "../hooks/useBlindEscrow";
import { useRole } from "../hooks/useRole";
import { useDealValues } from "../contexts/DealValuesContext";
import { formatDealState, getStateColor, shortAddress } from "@/lib/format";
import { MOCK_TOKENS } from "@/abi/MockTokenAddresses";

// Function to get token name from address
function getTokenName(address: string): string {
  const tokenMap: { [key: string]: string } = {
    [MOCK_TOKENS.MOCK_USDC]: "MockUSDC",
    [MOCK_TOKENS.MOCK_DAI]: "MockDAI",
  };
  return tokenMap[address] || shortAddress(address);
}
import { DEAL_STATE_LABELS } from "@/config/constants";
import { useRef, useEffect } from "react";

interface DealCardProps {
  deal: DealInfo;
  onAction?: () => void;
}

export default function DealCard({ deal, onAction }: DealCardProps) {
  const { address, submitAskWithThreshold, submitBid, revealMatch, bindRevealed, approvePayToken, settle } = useBlindEscrow();
  const { isSeller, isBuyer, isGuest, isPotentialBuyer } = useRole(deal);
  const { getDealValues } = useDealValues();

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
      // Step 1: Reveal via relayer (view call)
      const result = await revealMatch(deal.id);
      console.log("Reveal result:", result);
      
      if (!result.matched) {
        console.log("❌ No match found, stopping here");
        return;
      }
      
      // Step 2: Bind revealed prices (transaction)
      const storedValues = getDealValues(deal.id);
      const threshold = storedValues.threshold || 100;
      await bindRevealed(deal.id, result.askClear, result.bidClear, threshold);
      console.log("✅ Prices bound successfully");
      
      onAction?.();
    } catch (error) {
      console.error("Reveal and bind error:", error);
    }
  };

  const handleSettle = async () => {
    try {
      // Check if deal is already settled
      if (deal.state === DealState.Settled) {
        console.log("ℹ️ Deal is already settled");
        return;
      }
      
      // Step 1: Reveal via relayer (view call)
      const result = await revealMatch(deal.id);
      console.log("Reveal result:", result);
      
      if (!result.matched) {
        console.log("❌ No match found, cannot settle");
        return;
      }
      
      // Step 2: Bind revealed prices (transaction)
      const storedValues = getDealValues(deal.id);
      const threshold = storedValues.threshold || 100;
      await bindRevealed(deal.id, result.askClear, result.bidClear, threshold);
      console.log("✅ Prices bound successfully");
      
      // Step 3: Approve payToken (transaction) - only if user is buyer
      if (isBuyer && deal.payToken) {
        await approvePayToken(deal.payToken, BigInt(result.askClear));
        console.log("✅ PayToken approved successfully");
      }
      
      // Step 4: Settle (transaction) - new signature without parameters
      await settle(deal.id);
      console.log("✅ Deal settled successfully");
      
      onAction?.();
    } catch (error) {
      console.error("Settle error:", error);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Deal #{deal.id}</CardTitle>
            {isOpenDeal && (
              <Badge variant="info" className="mt-1 text-xs">
                {hasNoBuyer ? "OPEN - No Buyer" : "OPEN - Buyer Locked"}
              </Badge>
            )}
          </div>
          <Badge className={getStateColor(deal.state)}>
            {DEAL_STATE_LABELS[deal.state]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-2 gap-3 text-sm">
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
            <span className="text-xs font-medium">{getTokenName(deal.assetToken)}</span>
            <br />
            <span className="text-xs text-gray-500">Amount: {deal.assetAmount}</span>
          </div>
          <div>
            <span className="font-medium">Payment:</span>
            <br />
            <span className="text-xs font-medium">{getTokenName(deal.payToken)}</span>
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

        {/* Show deal information for settled deals */}
        {deal.state === DealState.Settled && (
          <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm font-medium text-green-800 mb-1">✅ Deal Completed</div>
            <div className="text-xs text-green-700 space-y-1">
              <div>• Asset transferred to buyer</div>
              <div>• Payment transferred to seller</div>
              <div>• Deal successfully settled</div>
            </div>
            <div className="mt-1 pt-1 border-t border-green-200">
              <div className="text-xs text-green-600">
                <div className="font-medium">Deal Details:</div>
                <div>• Asset Amount: {deal.assetAmount}</div>
                <div>• Asset Token: {getTokenName(deal.assetToken)}</div>
                <div>• Payment Token: {getTokenName(deal.payToken)}</div>
                {(() => {
                  const storedValues = getDealValues(deal.id);
                  if (storedValues.askClear && storedValues.bidClear) {
                    return (
                      <div className="mt-1 pt-1 border-t border-green-300">
                        <div className="font-medium">Settled Prices:</div>
                        <div>• Ask Price: {storedValues.askClear}</div>
                        <div>• Bid Price: {storedValues.bidClear}</div>
                        <div>• Threshold: {storedValues.threshold || 100}</div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Show deal information for canceled deals */}
        {deal.state === DealState.Canceled && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm font-medium text-red-800 mb-1">❌ Deal Canceled</div>
            <div className="text-xs text-red-700 space-y-1">
              <div>• Deal has been canceled</div>
              <div>• Asset returned to seller</div>
              <div>• No transaction completed</div>
            </div>
            <div className="mt-1 pt-1 border-t border-red-200">
              <div className="text-xs text-red-600">
                <div className="font-medium">Deal Details:</div>
                <div>• Asset Amount: {deal.assetAmount}</div>
                <div>• Asset Token: {getTokenName(deal.assetToken)}</div>
                <div>• Payment Token: {getTokenName(deal.payToken)}</div>
                <div>• Reason: Deal was canceled by seller or owner</div>
              </div>
            </div>
          </div>
        )}

        {!isGuest && (
          <div className="flex gap-1 flex-wrap">
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
        {!isGuest && !canSubmitAsk && !canSubmitBid && !canReveal && !canSettle && deal.state !== DealState.Settled && deal.state !== DealState.Canceled && (
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
            {deal.state === DealState.Created && (
              <p>📝 Deal created. Waiting for participants to submit ask/bid...</p>
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
