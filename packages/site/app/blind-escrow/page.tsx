"use client";

import { useEffect, useState } from "react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useAutoSwitchNetwork } from "@/hooks/useAutoSwitchNetwork";
import { useBlindEscrow } from "@/hooks/useBlindEscrow";
import { BLIND_ESCROW_ADDR, MOCK_USDC_ADDR, MOCK_DAI_ADDR } from "@/src/config/contracts";
import { MOCK_TOKENS } from "@/abi/MockTokenAddresses";

const CONTRACT = BLIND_ESCROW_ADDR;

// Helper functions for decimals conversion
const parseUnits = (value: string, decimals: number) => {
  return BigInt(Math.floor(parseFloat(value) * Math.pow(10, decimals)));
};

const formatUnits = (value: bigint, decimals: number) => {
  return (Number(value) / Math.pow(10, decimals)).toFixed(decimals);
};

// Token decimals
const USDC_DECIMALS = 6;
const DAI_DECIMALS = 18;

export default function BlindEscrowPage() {
  const { accounts, isConnected, connect, chainId } = useMetaMaskEthersSigner();
  const { isOnSepolia, isSwitching, switchError, switchToSepolia } = useAutoSwitchNetwork();
  
  // Guard: Check if contract address is valid
  if (!CONTRACT || CONTRACT === "" || CONTRACT === "0x0000000000000000000000000000000000000000") {
    return (
      <div className="min-h-screen bg-yellow-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">OTC Blind Escrow (FHE)</h1>
          <div className="bg-red-100 border border-red-300 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-4">⚠️ Contract Address Missing</h2>
            <p className="text-red-700 mb-4">
              Contract address is not configured. Please run the deployment script first.
            </p>
            <div className="bg-gray-100 p-4 rounded-lg text-left">
              <p className="text-sm text-gray-700 mb-2"><strong>To fix this:</strong></p>
              <ol className="text-sm text-gray-700 list-decimal list-inside space-y-1">
                <li>Run: <code className="bg-gray-200 px-2 py-1 rounded">cd packages/fhevm-hardhat-template</code></li>
                <li>Run: <code className="bg-gray-200 px-2 py-1 rounded">npx hardhat run scripts/deploy_with_addresses.mjs --network sepolia</code></li>
                <li>Restart the frontend</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const escrow = useBlindEscrow(CONTRACT);

  const [buyer, setBuyer] = useState("");
  const [assetToken, setAssetToken] = useState("");
  const [assetAmount, setAssetAmount] = useState("1000"); // 1000 USDC
  const [payToken, setPayToken] = useState("");
  const [threshold, setThreshold] = useState("100"); // 100 DAI threshold (raw units)
  const [hasThreshold, setHasThreshold] = useState(false);

  const [dealId, setDealId] = useState<number | null>(null);
  const [ask, setAsk] = useState("1000");
  const [bid, setBid] = useState("990");
  const [dealInfo, setDealInfo] = useState<any>(null);
  const [userRole, setUserRole] = useState<'seller' | 'buyer' | null>(null);

  const [reveal, setReveal] = useState<{ matched: boolean; askClear: number; bidClear: number } | null>(null);
  const [allowanceStatus, setAllowanceStatus] = useState<{ allowance: number; required: number; sufficient: boolean } | null>(null);
  const [tokenBalances, setTokenBalances] = useState<{
    usdc: { balance: string; formatted: string; symbol: string } | null;
    dai: { balance: string; formatted: string; symbol: string } | null;
  }>({ usdc: null, dai: null });

  // Auto-fill buyer address if connected
  useEffect(() => {
    if (accounts && accounts.length > 0 && !buyer) {
      setBuyer(accounts[0]);
    }
  }, [accounts, buyer]);

  // Load token balances when wallet connects
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      loadTokenBalances();
    }
  }, [accounts, assetToken, payToken]);

  // Load deal info when dealId changes
  const loadDealInfo = async (id: number) => {
    try {
      const info = await escrow.getDealInfo(id);
      setDealInfo(info);
      
      // Determine user role
      if (accounts && accounts[0]) {
        if (info.seller.toLowerCase() === accounts[0].toLowerCase()) {
          setUserRole('seller');
        } else if (info.buyer.toLowerCase() === accounts[0].toLowerCase()) {
          setUserRole('buyer');
        } else {
          setUserRole(null);
        }
      }
    } catch (error) {
      console.error("Load deal info error:", error);
    }
  };

  // Load deal info when dealId changes
  useEffect(() => {
    if (dealId) {
      loadDealInfo(dealId);
    }
  }, [dealId, accounts]);

  // Auto-fill Mock Token addresses
  useEffect(() => {
    if (!assetToken) {
      setAssetToken(MOCK_TOKENS.MOCK_USDC);
    }
    if (!payToken) {
      setPayToken(MOCK_TOKENS.MOCK_DAI);
    }
  }, [assetToken, payToken]);

  const approveToken = async () => {
    try {
      const assetAmountRaw = parseUnits(assetAmount, USDC_DECIMALS);
      await escrow.approveToken(assetToken, assetAmountRaw);
      alert("Token approved successfully!");
    } catch (error) {
      console.error("Approve error:", error);
      alert(`Approve Error: ${error}`);
    }
  };

  const create = async () => {
    try {
      // Convert to raw units based on token decimals
      const assetAmountRaw = parseUnits(assetAmount, USDC_DECIMALS);
      
      const id = await escrow.createDeal({
        buyer,
        assetToken,
        assetAmount: assetAmountRaw,
        payToken,
      });
      setDealId(id);
      setHasThreshold(false);
      alert(`Deal created with ID: ${id}`);
    } catch (error) {
      console.error("Create deal error:", error);
      alert(`Error: ${error}`);
    }
  };

  const setEncryptedThreshold = async () => {
    if (dealId == null) return;
    try {
      await escrow.setEncThreshold(dealId, Number(threshold));
      setHasThreshold(true);
      alert("Threshold set successfully!");
    } catch (error) {
      console.error("Set threshold error:", error);
    }
  };

  const doAsk = async () => {
    if (dealId == null) return;
    try {
      await escrow.submitAsk(dealId, Number(ask));
      alert("Ask submitted successfully!");
    } catch (error) {
      console.error("Submit ask error:", error);
    }
  };

  const doAskWithThreshold = async () => {
    if (dealId == null) return;
    try {
      await escrow.submitAskWithThreshold(dealId, Number(ask), Number(threshold));
      setHasThreshold(true);
      alert("Ask and threshold submitted successfully!");
    } catch (error) {
      console.error("Submit ask with threshold error:", error);
    }
  };

  const doBid = async () => {
    if (dealId == null) return;
    try {
      await escrow.submitBid(dealId, Number(bid));
      alert("Bid submitted successfully!");
    } catch (error) {
      console.error("Submit bid error:", error);
    }
  };

  const doReveal = async () => {
    if (dealId == null) return;
    try {
      const r = await escrow.revealMatch(dealId);
      setReveal(r);
      
      // Debug: Log ask/bid values
      console.log("🔍 Reveal Results:");
      console.log("Ask Clear:", r.askClear);
      console.log("Bid Clear:", r.bidClear);
      console.log("Matched:", r.matched);
      console.log("Asset Amount (from deal):", dealInfo?.assetAmount);
      
      // Check allowance after reveal
      if (r && userRole === 'buyer') {
        const allowance = await escrow.checkAllowance(dealId, r.askClear);
        setAllowanceStatus(allowance);
      }
      
      alert(`Reveal completed! Matched: ${typeof r.matched === 'boolean' ? r.matched : 'Encrypted (need relayer)'}`);
    } catch (error) {
      console.error("Reveal error:", error);
    }
  };

  const approvePayment = async () => {
    if (!reveal) return;
    try {
      // Contract expect raw units, not decimals
      const paymentAmount = BigInt(reveal.askClear);
      console.log("Approving payment amount (raw units):", paymentAmount.toString());
      await escrow.approvePaymentToken(payToken, paymentAmount);
      
      // Refresh allowance status
      if (dealId) {
        const allowance = await escrow.checkAllowance(dealId, reveal.askClear);
        setAllowanceStatus(allowance);
      }
      
      alert("Payment token approved successfully!");
    } catch (error) {
      console.error("Approve payment error:", error);
    }
  };

  const doSettle = async () => {
    if (dealId == null || !reveal) return;
    try {
      await escrow.settle(dealId, reveal.askClear, reveal.bidClear);
      alert("Settled successfully!");
      
      // Check settlement results
      console.log("🔄 Checking settlement results...");
      const results = await escrow.checkSettlementResults(dealId);
      
      // Refresh current user balances
      await loadTokenBalances();
      
      console.log("✅ Settlement completed! Check console for detailed results.");
    } catch (error) {
      console.error("Settle error:", error);
    }
  };


  const loadTokenBalances = async () => {
    if (!accounts || accounts.length === 0) {
      console.log("No accounts available, skipping balance load");
      return;
    }
    
    if (!assetToken || !payToken || assetToken === "" || payToken === "") {
      console.log("Token addresses not available, skipping balance load");
      return;
    }
    
    try {
      const userAddress = accounts[0];
      console.log("Loading balances for:", { userAddress, assetToken, payToken });
      
      // Load USDC balance
      const usdcBalance = await escrow.getTokenBalance(assetToken, userAddress);
      console.log("USDC balance result:", usdcBalance);
      
      // Load DAI balance
      const daiBalance = await escrow.getTokenBalance(payToken, userAddress);
      console.log("DAI balance result:", daiBalance);
      
      setTokenBalances({
        usdc: {
          balance: usdcBalance.balance,
          formatted: usdcBalance.formatted,
          symbol: usdcBalance.symbol
        },
        dai: {
          balance: daiBalance.balance,
          formatted: daiBalance.formatted,
          symbol: daiBalance.symbol
        }
      });
    } catch (error) {
      console.error("Load balances error:", error);
    }
  };

  const doCancel = async () => {
    if (dealId == null) return;
    try {
      await escrow.cancel(dealId);
      alert("Deal cancelled successfully!");
    } catch (error) {
      console.error("Cancel error:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">OTC Blind Escrow (FHE)</h1>
        <p className="mb-4">Vui lòng kết nối ví MetaMask để tiếp tục</p>
        <button 
          onClick={connect}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Kết nối MetaMask
        </button>
      </div>
    );
  }

  if (!isOnSepolia) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">OTC Blind Escrow (FHE)</h1>
        <p className="mb-4 text-red-600">
          ⚠️ Vui lòng chuyển sang mạng Sepolia để sử dụng dApp
        </p>
        <p className="mb-4 text-sm text-gray-600">
          Mạng hiện tại: {chainId ? `Chain ID: ${chainId}` : "Chưa kết nối"}
        </p>
        
        <button
          onClick={switchToSepolia}
          disabled={isSwitching}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl mb-4"
        >
          {isSwitching ? "Đang chuyển..." : "Chuyển sang Sepolia"}
        </button>
        
        {switchError && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
            <p><strong>Lỗi chuyển network:</strong> {switchError}</p>
          </div>
        )}
        
        <p className="text-sm text-gray-500">
          Hoặc: Mở MetaMask → Chọn mạng → Sepolia Testnet
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">OTC Blind Escrow (FHE)</h1>
      
      {/* Token Balances */}
      {accounts && accounts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-medium mb-3">💰 Wallet Balances</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {tokenBalances.usdc?.symbol || 'USDC'}
                  </p>
                  <p className="text-xs text-gray-500">Asset Token</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {tokenBalances.usdc?.formatted || '0.00'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Raw: {tokenBalances.usdc?.balance || '0'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {tokenBalances.dai?.symbol || 'DAI'}
                  </p>
                  <p className="text-xs text-gray-500">Payment Token</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {tokenBalances.dai?.formatted || '0.00'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Raw: {tokenBalances.dai?.balance || '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-3 flex gap-2">
            <button
              onClick={loadTokenBalances}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
            >
              🔄 Refresh Balances
            </button>
            <p className="text-xs text-gray-600 self-center">
              Address: {accounts[0]?.slice(0, 6)}...{accounts[0]?.slice(-4)}
            </p>
          </div>
        </div>
      )}
      <p className="text-center text-gray-600">
        Connected as: <span className="font-mono">{accounts?.[0]}</span>
        {userRole && (
          <span className={`ml-2 px-2 py-1 rounded text-sm ${
            userRole === 'seller' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {userRole === 'seller' ? '👤 Seller' : '👤 Buyer'}
          </span>
        )}
      </p>
      
      {/* Create Deal Section */}
      {!dealId && (
        <div className="p-6 border rounded-lg space-y-4 bg-green-50">
          <h2 className="text-xl font-semibold">1) Create New Deal (Seller)</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Lưu ý:</strong> Trước khi tạo deal, bạn cần approve MockUSDC cho BlindEscrow contract.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Buyer Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Asset Amount (USDC)</label>
              <input
                type="number"
                placeholder="1000"
                value={assetAmount}
                onChange={(e) => setAssetAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={approveToken}
              disabled={escrow.loading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400"
            >
              {escrow.loading ? "Approving..." : "Approve Token"}
            </button>
            <button
              onClick={create}
              disabled={escrow.loading || !buyer || !assetAmount}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
            >
              {escrow.loading ? "Creating..." : "Create Deal"}
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Amount:</strong> {assetAmount || 0} USDC = {assetAmount ? parseUnits(assetAmount, USDC_DECIMALS).toString() : '0'} raw units</p>
            <p><strong>P2P Mode:</strong> Không cần relayer để tạo deal!</p>
            <p><strong>Workflow:</strong> Approve Token → Create Deal → Set Threshold → Submit Prices</p>
          </div>
        </div>
      )}

      {/* Deal ID Input for Buyer */}
      {!dealId && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Or Load Existing Deal</h3>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Enter Deal ID"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              onChange={(e) => {
                const id = parseInt(e.target.value);
                if (id > 0) {
                  setDealId(id);
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                const id = parseInt(input.value);
                if (id > 0) {
                  setDealId(id);
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Load Deal
            </button>
          </div>
        </div>
      )}

      {/* Deal Info Display */}
      {dealInfo && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Deal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong>Deal ID:</strong> {dealId}</div>
            <div><strong>State:</strong> {dealInfo.state}</div>
            <div><strong>Seller:</strong> <span className="font-mono">{dealInfo.seller}</span></div>
            <div><strong>Buyer:</strong> <span className="font-mono">{dealInfo.buyer}</span></div>
            <div><strong>Asset Amount:</strong> {formatUnits(dealInfo.assetAmount, USDC_DECIMALS)} USDC</div>
            <div><strong>Has Ask:</strong> {dealInfo.hasAsk ? '✅' : '❌'}</div>
            <div><strong>Has Bid:</strong> {dealInfo.hasBid ? '✅' : '❌'}</div>
            <div><strong>Has Threshold:</strong> {dealInfo.hasThreshold ? '✅' : '❌'}</div>
          </div>
          
          {/* Deal Status Summary */}
          <div className="mt-3 p-3 bg-white border border-gray-300 rounded">
            <h4 className="font-medium text-gray-800 mb-2">Deal Status:</h4>
            {Number(dealInfo.state) === 0 && <p className="text-gray-600">❌ Deal does not exist</p>}
            {Number(dealInfo.state) === 1 && <p className="text-blue-600">📝 Deal created, waiting for prices...</p>}
            {Number(dealInfo.state) === 2 && <p className="text-yellow-600">⏳ Ask submitted, waiting for bid...</p>}
            {Number(dealInfo.state) === 3 && <p className="text-yellow-600">⏳ Bid submitted, waiting for ask...</p>}
            {Number(dealInfo.state) === 4 && <p className="text-green-600">✅ Ready to reveal! Both prices and threshold set.</p>}
            {Number(dealInfo.state) === 5 && <p className="text-green-600">🎉 Deal settled successfully</p>}
            {Number(dealInfo.state) === 6 && <p className="text-red-600">❌ Deal cancelled</p>}
          </div>
        </div>
      )}
      
      {/* Mock Token Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2"> Mock Tokens (Sepolia)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">MockUSDC:</span>
            <span className="font-mono ml-2 text-blue-600">{MOCK_TOKENS.MOCK_USDC}</span>
          </div>
          <div>
            <span className="font-medium">MockDAI:</span>
            <span className="font-mono ml-2 text-blue-600">{MOCK_TOKENS.MOCK_DAI}</span>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          💡 Token addresses tự động điền vào form bên dưới
        </p>
      </div>

      {/* Create Deal Section - Only for Seller and when no deal exists */}
      {userRole === 'seller' && !dealId && (
      <div className="p-6 border rounded-lg space-y-4 bg-gray-50">
        <h2 className="text-xl font-semibold">1) Create Deal (Seller)</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Lưu ý:</strong> Trước khi tạo deal, bạn cần approve MockUSDC cho BlindEscrow contract.
            <br />
            <span className="font-mono text-xs">Amount: {assetAmount} USDC = {parseUnits(assetAmount, USDC_DECIMALS).toString()} raw units</span>
            <br />
            <span className="text-green-600">✅ P2P Mode: Không cần relayer để tạo deal!</span>
            <br />
            <span className="text-blue-600">📋 Workflow: Approve Token → Create Deal → Set Threshold → Submit Prices</span>
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Buyer Address</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2" 
              placeholder="0x..." 
              value={buyer} 
              onChange={e=>setBuyer(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Asset Token Address</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2" 
              placeholder="0x..." 
              value={assetToken} 
              onChange={e=>setAssetToken(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Asset Amount (wei)</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2" 
              placeholder="1000000000000000000" 
              value={assetAmount} 
              onChange={e=>setAssetAmount(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pay Token Address</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2" 
              placeholder="0x..." 
              value={payToken} 
              onChange={e=>setPayToken(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Threshold (DAI raw units)</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2" 
              placeholder="100" 
              value={threshold} 
              onChange={e=>setThreshold(e.target.value)} 
            />
            <p className="text-xs text-gray-500 mt-1">
              Raw units (không có decimals). Ví dụ: 100 = 100 DAI raw units
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400" 
            onClick={approveToken} 
            disabled={escrow.loading}
          >
            {escrow.loading ? "Approving..." : "Approve Token"}
          </button>
          
        <button 
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400" 
          onClick={create} 
          disabled={escrow.loading}
        >
          {escrow.loading ? "Creating..." : "Create Deal"}
        </button>
        </div>
        {dealId && (
          <div className="p-3 bg-green-100 rounded-lg">
            <strong>Deal ID:</strong> {dealId}
          </div>
        )}
      </div>
      )}

      {/* Submit Prices Section - For both Seller and Buyer */}
      {dealId && (userRole === 'seller' || userRole === 'buyer') && (
      <div className="p-6 border rounded-lg space-y-4 bg-blue-50">
          <h2 className="text-xl font-semibold">2) Set Threshold & Submit Encrypted Prices</h2>
        
        {/* Threshold Section - Only for Seller */}
        {userRole === 'seller' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-medium text-orange-800 mb-3">Set Threshold (Seller)</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Threshold (DAI raw units)</label>
              <input 
                className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                placeholder="100" 
                value={threshold} 
                onChange={e=>setThreshold(e.target.value)} 
              />
            </div>
            <button 
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400" 
              onClick={setEncryptedThreshold} 
              disabled={escrow.loading || dealId==null || hasThreshold}
            >
              {escrow.loading ? "Setting..." : hasThreshold ? "✅ Set" : "Set Threshold"}
            </button>
          </div>
          <p className="text-xs text-orange-600 mt-2">
            {hasThreshold ? "✅ Threshold đã được set" : "⚠️ Cần set threshold trước khi submit ask"}
          </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seller Ask Section */}
          {userRole === 'seller' && (
          <div className="space-y-3">
            <h3 className="font-medium">Seller Ask (hidden)</h3>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2" 
              value={ask} 
              onChange={e=>setAsk(e.target.value)} 
            />
            <div className="space-y-2">
            <button 
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400" 
              onClick={doAsk} 
                disabled={escrow.loading || dealId==null || !hasThreshold}
              >
                {escrow.loading ? "Submitting..." : "Submit Ask Only"}
              </button>
              <button 
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400" 
                onClick={doAskWithThreshold} 
              disabled={escrow.loading || dealId==null}
            >
                {escrow.loading ? "Submitting..." : "Submit Ask + Threshold"}
            </button>
          </div>
            </div>
          )}
          
          {/* Buyer Bid Section */}
          {userRole === 'buyer' && (
          <div className="space-y-3">
            <h3 className="font-medium">Buyer Bid (hidden)</h3>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2" 
              value={bid} 
              onChange={e=>setBid(e.target.value)} 
            />
            <button 
              className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-400" 
              onClick={doBid} 
              disabled={escrow.loading || dealId==null}
            >
              {escrow.loading ? "Submitting..." : "Submit Bid"}
            </button>
          </div>
          )}
        </div>
      </div>
      )}


      {/* Reveal & Settle Section - Always show for debugging */}
      {dealId && (
      <div className="p-6 border rounded-lg space-y-4 bg-yellow-50">
        <h2 className="text-xl font-semibold">3) Reveal & Settle</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            🔐 <strong>FHEVM Relayer Required:</strong> Reveal function trả về encrypted result.
            <br />
            Cần FHEVM relayer để decrypt kết quả và lấy plaintext values.
            <br />
            <span className="text-xs">Hiện tại: Kết quả sẽ hiển thị "Encrypted (need relayer)"</span>
          </p>
        </div>
        {reveal && typeof reveal.matched === 'boolean' && reveal.matched && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✅ <strong>Matched!</strong> Buyer cần approve MockDAI trước khi settle.
              <br />
              <span className="font-mono text-xs">Amount: {reveal.askClear} DAI (raw units)</span>
            </p>
            
            {/* Allowance Status */}
            {allowanceStatus && (
              <div className="mt-2 p-2 bg-white rounded border">
                <p className="text-xs">
                  <strong>Allowance Status:</strong>
                  <br />
                  Current: {allowanceStatus.allowance} DAI
                  <br />
                  Required: {allowanceStatus.required} DAI
                  <br />
                  Status: {allowanceStatus.sufficient ? 
                    <span className="text-green-600">✅ Sufficient</span> : 
                    <span className="text-red-600">❌ Insufficient</span>
                  }
                </p>
              </div>
            )}
            
            
            <button
              onClick={approvePayment}
              disabled={escrow.loading}
              className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm rounded-lg"
            >
              {escrow.loading ? "Approving..." : "Approve Payment Token"}
            </button>
          </div>
        )}
        <div className="space-y-4">
          <button 
            className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400" 
            onClick={doReveal} 
            disabled={escrow.loading || dealId==null || !dealInfo || Number(dealInfo.state) !== 4}
          >
            {escrow.loading ? "Revealing..." : 
             !dealInfo ? "Loading deal info..." :
             Number(dealInfo.state) !== 4 ? `Deal not ready (state: ${dealInfo.state})` :
             "Reveal (via Relayer)"}
          </button>
          
          {reveal && (
            <div className="p-4 bg-white rounded-lg border">
              <h3 className="font-medium mb-2">Reveal Results:</h3>
              <div className="space-y-1">
                <div><strong>Matched:</strong> 
                  <span className={typeof reveal.matched === 'boolean' ? (reveal.matched ? "text-green-600" : "text-red-600") : "text-yellow-600"}>
                    {typeof reveal.matched === 'boolean' ? String(reveal.matched) : 'Encrypted (need relayer)'}
                  </span>
                </div>
                <div><strong>Ask (clear):</strong> {reveal.askClear || 'Need relayer to decrypt'}</div>
                <div><strong>Bid (clear):</strong> {reveal.bidClear || 'Need relayer to decrypt'}</div>
              </div>
              {typeof reveal.matched !== 'boolean' && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                  ⚠️ Kết quả đã được mã hóa. Cần FHEVM relayer để decrypt.
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-3">
            <button 
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400" 
              onClick={doSettle} 
              disabled={escrow.loading || !reveal || typeof reveal.matched !== 'boolean' || !reveal.matched}
            >
              {escrow.loading ? "Settling..." : "Settle"}
            </button>
            
            <button 
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400" 
              onClick={doCancel} 
              disabled={escrow.loading || dealId==null}
            >
              {escrow.loading ? "Cancelling..." : "Cancel Deal"}
            </button>
          </div>
        </div>
        
        {escrow.error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
            <strong>Error:</strong> {escrow.error}
          </div>
        )}
      </div>
      )}

      <div className="p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
        <h3 className="font-medium mb-2">Complete P2P Workflow:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li><strong>Seller:</strong> Approve MockUSDC → Create Deal (P2P, no relayer!)</li>
          <li><strong>Seller:</strong> Set encrypted threshold + Submit encrypted ask price</li>
          <li><strong>Buyer:</strong> Submit encrypted bid price</li>
          <li><strong>Both:</strong> Use "Reveal" to decrypt and check if prices match</li>
          <li><strong>Buyer:</strong> Approve MockDAI payment token → Settle if matched</li>
          <li><strong>Either:</strong> Use "Cancel" to cancel the deal if needed</li>
        </ol>
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
          <p className="text-green-700 text-xs">
            ✅ <strong>P2P Advantage:</strong> Create deal without relayer dependency!
          </p>
        </div>
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-700 text-xs">
            🔐 <strong>FHEVM:</strong> Encrypt/decrypt operations require relayer
          </p>
        </div>
      </div>
    </div>
  );
}
