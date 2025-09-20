"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DealInfo, DealState } from "@/lib/types";
import { useBlindEscrow } from "@/hooks/useBlindEscrow";
import { useRole } from "@/hooks/useRole";
import { formatDealState, getStateColor, shortAddress } from "@/lib/format";
import { DEAL_STATE_LABELS } from "@/config/constants";

interface DealCardProps {
  deal: DealInfo;
  onAction?: () => void;
}

export default function DealCard({ deal, onAction }: DealCardProps) {
  const { address, submitAskWithThreshold, submitBid, reveal, bind, settle } = useBlindEscrow();
  const { isSeller, isBuyer, isGuest } = useRole(deal);

  const canSubmitAsk = isSeller && (deal.state === DealState.Created || deal.state === DealState.B_Submitted);
  const canSubmitBid = isBuyer && (deal.state === DealState.Created || deal.state === DealState.A_Submitted);
  const canReveal = (isSeller || isBuyer) && deal.state === DealState.Ready;
  const canSettle = (isSeller || isBuyer) && deal.state === DealState.Ready;

  const handleSubmitAsk = async () => {
    try {
      await submitAskWithThreshold(deal.id, 1000, 100); // Demo values
      onAction?.();
    } catch (error) {
      console.error("Submit ask error:", error);
    }
  };

  const handleSubmitBid = async () => {
    try {
      await submitBid(deal.id, 990); // Demo value
      onAction?.();
    } catch (error) {
      console.error("Submit bid error:", error);
    }
  };

  const handleRevealAndBind = async () => {
    try {
      const result = await reveal(deal.id);
      console.log("Reveal result:", result);
      await bind(deal.id, result.askClear, result.bidClear);
      onAction?.();
    } catch (error) {
      console.error("Reveal error:", error);
    }
  };

  const handleSettle = async () => {
    try {
      const result = await reveal(deal.id);
      await bind(deal.id, result.askClear, result.bidClear);
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
          <CardTitle>Deal #{deal.id}</CardTitle>
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
            <span className="font-mono text-xs">{shortAddress(deal.buyer)}</span>
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

        {isGuest && (
          <div className="text-sm text-gray-500 text-center py-2">
            Connect wallet to interact with this deal
          </div>
        )}
      </CardContent>
    </Card>
  );
}
