"use client";

import { useEffect, useState } from "react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useAutoSwitchNetwork } from "@/hooks/useAutoSwitchNetwork";
import { useBlindEscrow } from "@/hooks/useBlindEscrow";
import { config } from "@/config";
import { MOCK_TOKENS } from "@/abi/MockTokenAddresses";

const CONTRACT = config.BLIND_ESCROW_ADDR;

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

  const [reveal, setReveal] = useState<{ matched: boolean; askClear: number; bidClear: number } | null>(null);

  // Auto-fill buyer address if connected
  useEffect(() => {
    if (accounts && accounts.length > 0 && !buyer) {
      setBuyer(accounts[0]);
    }
  }, [accounts, buyer]);

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
      alert(`Reveal completed! Matched: ${typeof r.matched === 'boolean' ? r.matched : 'Encrypted (need relayer)'}`);
    } catch (error) {
      console.error("Reveal error:", error);
    }
  };

  const doSettle = async () => {
    if (dealId == null || !reveal) return;
    try {
      await escrow.settle(dealId, reveal.askClear, reveal.bidClear);
      alert("Settled successfully!");
    } catch (error) {
      console.error("Settle error:", error);
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
      <p className="text-center text-gray-600">
        Connected as: <span className="font-mono">{accounts?.[0]}</span>
      </p>
      
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

      <div className="p-6 border rounded-lg space-y-4 bg-blue-50">
        <h2 className="text-xl font-semibold">2) Set Threshold & Submit Encrypted Prices</h2>
        
        {/* Threshold Section */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
      </div>

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
              <span className="font-mono text-xs">Amount: {reveal.askClear} DAI = {parseUnits(reveal.askClear.toString(), DAI_DECIMALS).toString()} raw units</span>
            </p>
          </div>
        )}
        <div className="space-y-4">
          <button 
            className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400" 
            onClick={doReveal} 
            disabled={escrow.loading || dealId==null}
          >
            {escrow.loading ? "Revealing..." : "Reveal (via Relayer)"}
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

      <div className="p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
        <h3 className="font-medium mb-2">P2P Workflow Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li><strong>Seller:</strong> Approve asset token → Create Deal (no relayer needed!)</li>
          <li><strong>Seller:</strong> Set encrypted threshold (when relayer ready)</li>
          <li><strong>Seller:</strong> Submit encrypted ask price</li>
          <li><strong>Buyer:</strong> Submit encrypted bid price</li>
          <li><strong>Both:</strong> Use "Reveal" to check if prices match within threshold</li>
          <li><strong>Buyer:</strong> Approve payment token → Settle if matched</li>
          <li><strong>Either:</strong> Use "Cancel" to cancel the deal if needed</li>
        </ol>
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
          <p className="text-green-700 text-xs">
            ✅ <strong>P2P Advantage:</strong> Create deal without relayer dependency!
          </p>
        </div>
      </div>
    </div>
  );
}
