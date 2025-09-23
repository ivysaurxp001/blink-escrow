"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useBlindEscrow } from '@/hooks/useBlindEscrow';
import { useDealsQuery } from '@/hooks/useDealsQuery';
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
    [MOCK_TOKENS.MOCK_USDC]: "Z-USDC",
    [MOCK_TOKENS.MOCK_DAI]: "Z-DAI",
  };
  return tokenMap[address] || shortAddress(address);
}

export default function DealDetailPage() {
  const params = useParams();
  const dealId = parseInt(params.id as string);
  const { address } = useAccount();
  const { submitBidToDeal, revealMatchAndDecrypt } = useBlindEscrow();
  const { getDeal } = useDealsQuery();
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
        console.log('🔍 Loading deal with ID:', dealId);
        const dealData = await getDeal(dealId);
        console.log('🔍 Deal loaded successfully:', dealData);
        console.log('🔍 Deal debug info:', {
          dealId,
          seller: dealData.seller,
          buyer: dealData.buyer,
          currentAddress: address,
          isSeller: address && dealData.seller.toLowerCase() === address.toLowerCase(),
          isBuyer: address && dealData.buyer.toLowerCase() === address.toLowerCase(),
          dealMode: dealData.mode,
          dealState: dealData.state,
          isP2P: dealData.mode === 0,
          isOPEN: dealData.mode === 1
        });
        setDeal(dealData);
      } catch (err) {
        console.error('❌ Error loading deal:', err);
        setError(err instanceof Error ? err.message : 'Failed to load deal');
      } finally {
        setLoading(false);
      }
    };

    if (dealId) {
      loadDeal();
    }
  }, [dealId, getDeal, address]);

  const { isSeller, isBuyer, isGuest, isPotentialBuyer } = useRole(deal);
  
  // Debug: Check wallet connection and reveal conditions
  console.log("🔍 Deal detail page debug:", { 
    address, 
    isConnected: !!address,
    isSeller, 
    isBuyer, 
    isGuest, 
    isPotentialBuyer,
    dealState: deal?.state,
    dealMode: deal?.mode,
    DealStateReady: DealState.Ready,
    isP2P: deal?.mode === 0,
    isOPEN: deal?.mode === 1,
    showRevealButton: deal?.state === DealState.Ready && (isSeller || isBuyer),
    showP2PSection: deal?.mode === 0,
    showGeneralSection: deal?.state === DealState.Ready && (isSeller || isBuyer)
  });

  // Action handlers
  const handleSubmitBid = async (bidAmount: string) => {
    if (!deal) return;
    
    try {
      setActionLoading('submitBid');
      await submitBidToDeal(deal.id, Number(bidAmount));
      // Reload deal data
      const updatedDeal = await getDeal(dealId);
      setDeal(updatedDeal);
    } catch (error) {
      console.error('Submit bid error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitAskWithThreshold = async (askAmount: string, threshold: string) => {
    if (!deal) return;
    
    try {
      setActionLoading('submitAsk');
      // TODO: Implement submitAskWithThreshold
      console.log('TODO: Implement submitAskWithThreshold', deal.id, askAmount, threshold);
      
      // Reload deal data
      const updatedDeal = await getDeal(dealId);
      setDeal(updatedDeal);
    } catch (error) {
      console.error('Submit ask with threshold error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevealAndBind = async () => {
    if (!deal) return;
    
    try {
      setActionLoading('reveal');
      
      // Debug: Check stored values before reveal
      const storedValues = getDealValues(deal.id);
      console.log("🔍 Stored values before reveal:", storedValues);
      
      const result = await revealMatchAndDecrypt(deal.id);
      
      if (!result.matched) {
        console.log("❌ No match found, stopping here");
        return;
      }
      
      const threshold = storedValues.threshold || 100;
      // TODO: Implement bindRevealed
      console.log('TODO: Implement bindRevealed', deal.id, result.askPlain, result.bidPlain, threshold);
      
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
      // TODO: Implement settle
      console.log('TODO: Implement settle', deal.id);
      
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
      // TODO: Implement cancelDeal
      console.log('TODO: Implement cancelDeal', deal.id);
      
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
    console.log('🔍 Deal detail page: Loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded mb-4"></div>
              <div className="h-64 bg-white/20 rounded"></div>
            </div>
            <div className="mt-4 text-center text-white/60">
              Loading deal {dealId}...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    console.log('🔍 Deal detail page: Error or no deal state', { error, deal });
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-red-300 mb-4">Error</h1>
                <p className="text-gray-300">{error || 'Deal not found'}</p>
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
                  <p className="text-yellow-300 text-sm">
                    🔍 DEBUG: Deal ID = {dealId}, Error = {error}, Deal = {deal ? 'exists' : 'null'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const Zero = "0x0000000000000000000000000000000000000000";
  const isOpenDeal = deal.mode === 1; // DealMode.OPEN

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="mb-6 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30"
          >
            ← Back to Marketplace
          </Button>

          {/* Deal Card */}
          <Card className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-white font-bold">Deal #{deal.id}</CardTitle>
                <Badge 
                  className={`px-3 py-1 text-xs font-medium ${getStateColor(deal.state)} bg-opacity-20 border-opacity-30`}
                >
                  {formatDealState(deal.state)}
                </Badge>
              </div>
            </CardHeader>
          
            <CardContent className="space-y-4 text-white">
              {/* Deal Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-300">Seller:</span>
                  <br />
                  <span className="font-mono text-xs text-gray-300">{shortAddress(deal.seller)}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-300">Buyer:</span>
                  <br />
                  <span className="font-mono text-xs text-gray-300">
                    {deal.buyer === Zero ? "Not assigned" : shortAddress(deal.buyer)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-green-300">Asset:</span>
                  <br />
                  <span className="text-xs font-medium text-white">{getTokenName(deal.assetToken)}</span>
                  <br />
                  <span className="text-xs text-gray-400">Amount: {deal.assetAmount}</span>
                </div>
                <div>
                  <span className="font-medium text-green-300">Payment:</span>
                  <br />
                  <span className="text-xs font-medium text-white">{getTokenName(deal.payToken)}</span>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center gap-2">
                <span className="font-medium text-purple-300">Status:</span>
                <div className="flex gap-1">
                  {deal.hasAsk && <Badge variant="success" size="sm" className="bg-green-500/20 text-green-300 border-green-400/30">Ask</Badge>}
                  {deal.hasBid && <Badge variant="info" size="sm" className="bg-blue-500/20 text-blue-300 border-blue-400/30">Bid</Badge>}
                  {deal.hasThreshold && <Badge variant="warning" size="sm" className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30">Threshold</Badge>}
                </div>
              </div>

              {/* Action Buttons */}
              {deal.state === DealState.A_Submitted && isPotentialBuyer && deal.mode === 1 && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-300 mb-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 p-3 rounded-lg backdrop-blur-sm">
                    This deal is waiting for a buyer. You can become the buyer and submit a bid.
                  </p>
                  <Button 
                    onClick={() => {
                      const bidAmount = prompt("Enter your bid amount:");
                      if (bidAmount) handleSubmitBid(bidAmount);
                    }}
                    disabled={actionLoading === 'submitBid'}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-0 shadow-lg hover:shadow-green-500/25 transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {actionLoading === 'submitBid' ? 'Submitting...' : 'Become Buyer & Submit Bid'}
                  </Button>
                </div>
              )}

              {/* P2P Deal Info */}
              {deal.mode === 0 && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-300 mb-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/20 p-3 rounded-lg backdrop-blur-sm">
                    This is a P2P deal. Only the assigned buyer ({shortAddress(deal.buyer)}) can participate.
                  </p>
                  
                  {/* Wallet not connected */}
                  {!address && (
                    <div className="mt-4">
                      <p className="text-sm text-yellow-300 mb-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/20 p-3 rounded-lg backdrop-blur-sm">
                        ⚠️ Please connect your wallet to interact with this deal.
                      </p>
                    </div>
                  )}
                  
                  {/* P2P Buyer Actions - Submit Bid */}
                  {address && isBuyer && (deal.state === DealState.A_Submitted || deal.state === 1) && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-300 mb-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 p-3 rounded-lg backdrop-blur-sm">
                        You are the assigned buyer. You can submit your bid to participate in this deal.
                      </p>
                      <Button 
                        onClick={() => {
                          const bidAmount = prompt("Enter your bid amount:");
                          if (bidAmount) handleSubmitBid(bidAmount);
                        }}
                        disabled={actionLoading === 'submitBid'}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-0 shadow-lg hover:shadow-green-500/25 transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        {actionLoading === 'submitBid' ? 'Submitting...' : 'Submit Bid'}
                      </Button>
                    </div>
                  )}

                  {/* P2P Buyer Actions - After Bid Submitted */}
                  {isBuyer && (deal.state === DealState.B_Submitted || deal.state === 3) && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-300 mb-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/20 p-3 rounded-lg backdrop-blur-sm">
                        ✅ Your bid has been submitted! You can now reveal and bind the deal.
                      </p>
                      <Button 
                        onClick={handleRevealAndBind}
                        disabled={actionLoading === 'reveal'}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white border-0 shadow-lg hover:shadow-orange-500/25 transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        {actionLoading === 'reveal' ? 'Revealing...' : 'Reveal & Bind'}
                      </Button>
                      <p className="text-xs text-gray-400 text-center mt-2">
                        This will check if your bid matches the seller's ask within the threshold.
                      </p>
                    </div>
                  )}

                  {/* P2P Ready State - Reveal & Bind */}
                  {isBuyer && (deal.state === DealState.Ready || deal.state === 4) && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-300 mb-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-400/20 p-3 rounded-lg backdrop-blur-sm">
                        🎯 Deal is ready! You can now reveal and bind the deal to check if it matches.
                      </p>
                      <Button 
                        onClick={handleRevealAndBind}
                        disabled={actionLoading === 'reveal'}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white border-0 shadow-lg hover:shadow-orange-500/25 transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        {actionLoading === 'reveal' ? 'Revealing...' : 'Reveal & Bind'}
                      </Button>
                    </div>
                  )}
                  
                  {/* P2P Seller Actions */}
                  {isSeller && deal.state === DealState.Created && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-300 mb-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/20 p-3 rounded-lg backdrop-blur-sm">
                        You are the seller. Submit your ask price and threshold to start the deal.
                      </p>
                      <Button 
                        onClick={() => {
                          const askAmount = prompt("Enter your ask amount:");
                          const threshold = prompt("Enter threshold:");
                          if (askAmount && threshold) {
                            handleSubmitAskWithThreshold(askAmount, threshold);
                          }
                        }}
                        disabled={actionLoading === 'submitAsk'}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        {actionLoading === 'submitAsk' ? 'Submitting...' : 'Submit Ask & Threshold'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* DEBUG: Always show reveal button for testing */}
              {deal.state === DealState.Ready && (
                <div className="pt-4 border-t border-white/10">
                  <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
                    <p className="text-xs text-yellow-300">
                      🔍 DEBUG: Deal state = {deal.state}, isSeller = {isSeller ? 'true' : 'false'}, isBuyer = {isBuyer ? 'true' : 'false'}
                    </p>
                  </div>
                  <Button 
                    onClick={handleRevealAndBind}
                    disabled={actionLoading === 'reveal'}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white border-0 shadow-lg hover:shadow-orange-500/25 transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {actionLoading === 'reveal' ? 'Revealing...' : 'Reveal & Bind (DEBUG)'}
                  </Button>
                  <p className="text-xs text-gray-400 mt-3 text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 p-2 rounded-lg backdrop-blur-sm">
                    After reveal, if matched = true, you can settle. If matched = false, deal will be unsuccessful.
                  </p>
                </div>
              )}

              {deal.state === DealState.Settled && (
                <div className="pt-4 border-t border-white/10">
                  <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-lg backdrop-blur-sm">
                    <div className="text-sm font-medium text-green-300 mb-2 flex items-center">
                      <span className="mr-2">✅</span> Deal Completed
                    </div>
                    <div className="text-xs text-green-200 space-y-1">
                      <div>• Asset transferred to buyer</div>
                      <div>• Payment transferred to seller</div>
                      <div>• Deal successfully settled</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-400/20">
                      <div className="text-xs text-green-300">
                        <div className="font-medium">Deal Details:</div>
                        <div>• Asset Amount: {deal.assetAmount}</div>
                        <div>• Asset Token: {getTokenName(deal.assetToken)}</div>
                        <div>• Payment Token: {getTokenName(deal.payToken)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {deal.state === DealState.Canceled && (
                <div className="pt-4 border-t border-white/10">
                  <div className="p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-400/30 rounded-lg backdrop-blur-sm">
                    <div className="text-sm font-medium text-red-300 mb-2 flex items-center">
                      <span className="mr-2">❌</span> Deal Unsuccessful
                    </div>
                    <div className="text-xs text-red-200 space-y-1">
                      <div>• Asset Amount: {deal.assetAmount}</div>
                      <div>• Asset Token: {getTokenName(deal.assetToken)}</div>
                      <div>• Payment Token: {getTokenName(deal.payToken)}</div>
                      <div>• Reason: Ask and bid did not match within threshold</div>
                    </div>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}