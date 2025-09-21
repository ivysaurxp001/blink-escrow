"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useBlindEscrow } from '@/hooks/useBlindEscrow';
import { useDealValues } from '@/contexts/DealValuesContext';
import { DealInfo, DealState } from '@/lib/types';
import { formatDealState, getStateColor, shortAddress } from '@/lib/format';
import { MOCK_TOKENS } from '@/abi/MockTokenAddresses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useRole } from '@/hooks/useRole';
import { useAccount } from 'wagmi';
import { DEAL_STATE_LABELS } from '@/config/constants';

// Function to get token name from address
function getTokenName(address: string): string {
  const tokenMap: { [key: string]: string } = {
    [MOCK_TOKENS.MOCK_USDC]: "MockUSDC",
    [MOCK_TOKENS.MOCK_DAI]: "MockDAI",
  };
  return tokenMap[address] || shortAddress(address);
}

export default function DealDetailPage() {
  const params = useParams();
  const dealId = parseInt(params.id as string);
  const { address } = useAccount();
  const { getDeal, submitBid, revealMatch, bindRevealed, approvePayToken, settle, cancelDeal } = useBlindEscrow();
  const { getDealValues } = useDealValues();
  
  const [deal, setDeal] = useState<DealInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load deal data
  useEffect(() => {
    const loadDeal = async () => {
      try {
        setLoading(true);
        const dealData = await getDeal(dealId);
        setDeal(dealData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deal');
      } finally {
        setLoading(false);
      }
    };

    if (dealId) {
      loadDeal();
    }
  }, [dealId, getDeal]);

  const { isSeller, isBuyer, isGuest, isPotentialBuyer } = useRole(deal);

  // Action handlers
  const handleSubmitBid = async (bidAmount: string) => {
    if (!deal) return;
    
    try {
      setActionLoading('submitBid');
      await submitBid(deal.id, Number(bidAmount));
      // Reload deal data
      const updatedDeal = await getDeal(dealId);
      setDeal(updatedDeal);
    } catch (error) {
      console.error('Submit bid error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevealAndBind = async () => {
    if (!deal) return;
    
    try {
      setActionLoading('reveal');
      const result = await revealMatch(deal.id);
      
      if (!result.matched) {
        console.log("❌ No match found, stopping here");
        return;
      }
      
      const storedValues = getDealValues(deal.id);
      const threshold = storedValues.threshold || 100;
      await bindRevealed(deal.id, result.askClear, result.bidClear, threshold);
      
      // Reload deal data
      const updatedDeal = await getDeal(dealId);
      setDeal(updatedDeal);
    } catch (error) {
      console.error('Reveal and bind error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSettle = async () => {
    if (!deal) return;
    
    try {
      setActionLoading('settle');
      
      // Step 1: Approve pay token if needed
      // Note: This should be done before settle, with proper amount calculation
      // For now, we'll skip this step as it needs proper implementation
      
      // Step 2: Settle the deal
      await settle(deal.id);
      
      // Reload deal data
      const updatedDeal = await getDeal(dealId);
      setDeal(updatedDeal);
    } catch (error) {
      console.error('Settle error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!deal) return;
    
    try {
      setActionLoading('cancel');
      await cancelDeal(deal.id);
      
      // Reload deal data
      const updatedDeal = await getDeal(dealId);
      setDeal(updatedDeal);
    } catch (error) {
      console.error('Cancel error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
              <p className="text-gray-600">{error || 'Deal not found'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const Zero = "0x0000000000000000000000000000000000000000";
  const isOpenDeal = deal.mode === 1; // DealMode.OPEN

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="mb-6"
        >
          ← Back to Marketplace
        </Button>

        {/* Deal Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Deal #{deal.id}</CardTitle>
              <Badge 
                className={`px-3 py-1 text-xs font-medium ${getStateColor(deal.state)}`}
              >
                {formatDealState(deal.state)}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {/* Deal Info */}
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
                  {deal.buyer === Zero ? "Not assigned" : shortAddress(deal.buyer)}
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

            {/* Status Indicators */}
            <div className="flex gap-1">
              {deal.hasAsk && <Badge variant="default" className="text-xs">Ask</Badge>}
              {deal.hasBid && <Badge variant="default" className="text-xs">Bid</Badge>}
              {deal.hasThreshold && <Badge variant="default" className="text-xs">Threshold</Badge>}
            </div>

            {/* Action Buttons */}
            {deal.state === DealState.A_Submitted && isPotentialBuyer && (
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600 mb-3">
                  This deal is waiting for a buyer. You can become the buyer and submit a bid.
                </p>
                <Button 
                  onClick={() => {
                    const bidAmount = prompt("Enter your bid amount:");
                    if (bidAmount) handleSubmitBid(bidAmount);
                  }}
                  disabled={actionLoading === 'submitBid'}
                  className="w-full"
                >
                  {actionLoading === 'submitBid' ? 'Submitting...' : 'Become Buyer & Submit Bid'}
                </Button>
              </div>
            )}

            {deal.state === DealState.Ready && (isSeller || isBuyer) && (
              <div className="pt-3 border-t">
                <Button 
                  onClick={handleRevealAndBind}
                  disabled={actionLoading === 'reveal'}
                  className="w-full"
                >
                  {actionLoading === 'reveal' ? 'Revealing...' : 'Reveal & Bind'}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  After reveal, if matched = true, you can settle. If matched = false, deal will be unsuccessful.
                </p>
              </div>
            )}

            {deal.state === DealState.Settled && (
              <div className="pt-3 border-t border-green-200">
                <div className="text-xs text-green-600">
                  <div className="font-medium">Deal Completed</div>
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
                  </div>
                </div>
              </div>
            )}

            {deal.state === DealState.Canceled && (
              <div className="pt-3 border-t border-red-200">
                <div className="text-xs text-red-600">
                  <div className="font-medium">Deal Unsuccessful</div>
                  <div>• Asset Amount: {deal.assetAmount}</div>
                  <div>• Asset Token: {getTokenName(deal.assetToken)}</div>
                  <div>• Payment Token: {getTokenName(deal.payToken)}</div>
                  <div>• Reason: Ask and bid did not match within threshold</div>
                </div>
              </div>
            )}

            {/* Debug Info */}
            <div className="pt-3 border-t text-xs text-gray-500">
              <div>Debug: isGuest={isGuest.toString()}, canBecomeBuyer={isPotentialBuyer.toString()}, address={address ? 'connected' : 'not connected'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
