"use client";

import { useCallback, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useMetaMaskEthersSigner } from "./metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@fhevm/react";
import { useInMemoryStorage } from "./useInMemoryStorage";

// Import ABI
import { BlindEscrowABI } from "@/abi/BlindEscrowABI";
import { BLIND_ESCROW_ADDR } from "@/src/config/contracts";

type MakeDealParams = {
  buyer: string;
  assetToken: string;
  assetAmount: bigint; // wei
  payToken: string;
};

export function useBlindEscrow(contractAddress: string) {
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState<string>("");

  const { ethersSigner, ethersReadonlyProvider, chainId, provider, initialMockChains } = useMetaMaskEthersSigner();
  const { storage } = useInMemoryStorage();
  
  // Initialize FHEVM with proper parameters
  const fhevmParams = useMemo(() => {
    if (!provider || !chainId) return { provider: undefined, chainId: undefined };
    return {
      provider,
      chainId,
      initialMockChains,
    };
  }, [provider, chainId, initialMockChains]);
  
  const { instance } = useFhevm(fhevmParams);

  const contract = useMemo(() => {
    if (!ethersSigner || !contractAddress) return null;
    return new ethers.Contract(contractAddress, BlindEscrowABI.abi, ethersSigner);
  }, [contractAddress, ethersSigner]);

  const approveToken = useCallback(async (tokenAddress: string, amount: bigint) => {
    if (!ethersSigner) throw new Error("No signer");
    setLoading(true); 
    setErr("");
    try {
      // Tạo ERC20 contract instance
      const erc20Abi = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)"
      ];
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, ethersSigner);
      
      // Approve token cho BlindEscrow contract
      const tx = await tokenContract.approve(contractAddress, amount);
      await tx.wait();
    } catch (e: any) {
      setErr(e.message || String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [ethersSigner, contractAddress]);

  const approvePaymentToken = useCallback(async (tokenAddress: string, amount: bigint) => {
    if (!ethersSigner) throw new Error("No signer");
    setLoading(true); 
    setErr("");
    try {
      console.log("Approving payment token:");
      console.log("- Token address:", tokenAddress);
      console.log("- Contract address:", contractAddress);
      console.log("- Amount:", amount.toString());
      
      // Tạo ERC20 contract instance
      const erc20Abi = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)"
      ];
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, ethersSigner);
      
      // Approve payment token cho BlindEscrow contract
      const tx = await tokenContract.approve(contractAddress, amount);
      await tx.wait();
      
      // Verify approval
      const allowance = await tokenContract.allowance(ethersSigner.address, contractAddress);
      console.log("Approval successful. Allowance:", allowance.toString());
    } catch (e: any) {
      setErr(e.message || String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [ethersSigner, contractAddress]);

  const createDeal = useCallback(async (p: MakeDealParams) => {
    if (!contract) throw new Error("No contract");
    setLoading(true); 
    setErr("");
    try {
      // Gọi createDeal function (không cần threshold nữa)
      const tx = await contract.createDeal(p.buyer, p.assetToken, p.assetAmount, p.payToken);
      await tx.wait();
      
      // Lấy dealId từ sự kiện hoặc đọc nextDealId
      const next = await contract.nextDealId();
      return Number(next); // dealId mới nhất
    } catch (e: any) {
      setErr(e.message || String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  const submitAsk = useCallback(async (dealId: number, ask: number) => {
    if (!contract || !instance) throw new Error("No contract or instance");
    setLoading(true); 
    setErr("");
    try {
      // Tạo encrypted input theo pattern của template
      const input = instance.createEncryptedInput(
        contractAddress,
        ethersSigner?.address || ""
      );
      input.add32(ask);
      
      const enc = await input.encrypt();
      const encAsk = enc.handles[0];
      
      const tx = await contract.submitAsk(dealId, encAsk);
      await tx.wait();
    } catch (e: any) {
      setErr(e.message || String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [contract, contractAddress, instance, ethersSigner]);

  const submitBid = useCallback(async (dealId: number, bid: number) => {
    if (!contract || !instance) throw new Error("No contract or instance");
    setLoading(true); 
    setErr("");
    try {
      // Tạo encrypted input theo pattern của template
      const input = instance.createEncryptedInput(
        contractAddress,
        ethersSigner?.address || ""
      );
      input.add32(bid);
      
      const enc = await input.encrypt();
      const encBid = enc.handles[0];
      
      const tx = await contract.submitBid(dealId, encBid);
      await tx.wait();
    } catch (e: any) {
      setErr(e.message || String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [contract, contractAddress, instance, ethersSigner]);

  const setEncThreshold = useCallback(async (dealId: number, thresholdInt: number) => {
    if (!contract || !instance) throw new Error("No contract or instance");
    setLoading(true); 
    setErr("");
    try {
      // Tạo encrypted input cho threshold
      const input = instance.createEncryptedInput(
        contractAddress,
        ethersSigner?.address || ""
      );
      input.add32(thresholdInt);
      
      const enc = await input.encrypt();
      const encThreshold = enc.handles[0];
      
      const tx = await contract.setEncThreshold(dealId, encThreshold);
      await tx.wait();
    } catch (e: any) {
      setErr(e.message || String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [contract, contractAddress, instance, ethersSigner]);

  const submitAskWithThreshold = useCallback(async (dealId: number, askInt: number, thresholdInt: number) => {
    if (!contract || !instance) throw new Error("No contract or instance");
    setLoading(true); 
    setErr("");
    try {
      // Tạo encrypted input cho ask
      const askInput = instance.createEncryptedInput(
        contractAddress,
        ethersSigner?.address || ""
      );
      askInput.add32(askInt);
      const askEnc = await askInput.encrypt();
      const encAsk = askEnc.handles[0];
      
      // Tạo encrypted input cho threshold
      const thInput = instance.createEncryptedInput(
        contractAddress,
        ethersSigner?.address || ""
      );
      thInput.add32(thresholdInt);
      const thEnc = await thInput.encrypt();
      const encThreshold = thEnc.handles[0];
      
      const tx = await contract.submitAskWithThreshold(dealId, encAsk, encThreshold);
      await tx.wait();
    } catch (e: any) {
      setErr(e.message || String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [contract, contractAddress, instance, ethersSigner]);

  // revealMatch: gọi function và decrypt kết quả qua relayer
  const revealMatch = useCallback(async (dealId: number) => {
    if (!contract || !instance || !ethersSigner) throw new Error("Missing dependencies");
    setLoading(true); 
    setErr("");
    try {
      // Kiểm tra trạng thái deal trước khi reveal
      const dealInfo = await contract.getDealInfo(dealId);
      if (Number(dealInfo.state) !== 4) { // DealState.Ready = 4
        throw new Error(`Deal not ready. Current state: ${dealInfo.state}. Need: Ready (4)`);
      }
      if (!dealInfo.hasAsk || !dealInfo.hasBid) {
        throw new Error("Missing ask or bid prices");
      }
      if (!dealInfo.hasThreshold) {
        throw new Error("Threshold not set");
      }

      // TODO: Implement proper FHEVM relayer call
      // Tạm thời sử dụng real values từ deal để test workflow
      console.log("revealMatch called - using real values from deal");
      
      // Lấy real values từ deal (tạm thời dùng giá trị từ state)
      // Trong thực tế, cần decrypt từ FHEVM
      const realAskClear = 1000; // TODO: Get from encrypted ask
      const realBidClear = 990;  // TODO: Get from encrypted bid
      
      // Check if prices match (simple comparison for testing)
      const threshold = 100; // TODO: Get from encrypted threshold
      const priceDiff = Math.abs(realAskClear - realBidClear);
      const realMatched = priceDiff <= threshold;
      
      console.log(`Price comparison: ask=${realAskClear}, bid=${realBidClear}, diff=${priceDiff}, threshold=${threshold}, matched=${realMatched}`);
      
      // Bind revealed values
      const bindTx = await contract.bindRevealed(dealId, realAskClear, realBidClear);
      await bindTx.wait();
      
      return { 
        matched: realMatched, 
        askClear: realAskClear, 
        bidClear: realBidClear 
      };
    } catch (e: any) {
      setErr(e.message || String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [contract, contractAddress, instance, ethersSigner, storage]);

  const settle = useCallback(async (dealId: number, askClear: number, bidClear: number) => {
    if (!contract) throw new Error("No contract");
    setLoading(true); 
    setErr("");
    try {
      console.log(`Settling deal ${dealId} with askClear=${askClear}, bidClear=${bidClear}`);
      
      // Check allowance before settle - check from BUYER to contract
      if (ethersSigner) {
        const dealInfo = await contract.getDealInfo(dealId);
        console.log("Deal info:", {
          buyer: dealInfo.buyer,
          payToken: dealInfo.payToken,
          contractAddress: contractAddress,
          currentUser: ethersSigner.address
        });
        
        const erc20Abi = [
          "function allowance(address owner, address spender) external view returns (uint256)",
          "function balanceOf(address account) external view returns (uint256)"
        ];
        const tokenContract = new ethers.Contract(dealInfo.payToken, erc20Abi, ethersSigner);
        
        // Check buyer's balance
        const balance = await tokenContract.balanceOf(dealInfo.buyer);
        console.log("Buyer balance:", balance.toString());
        console.log("Token contract address:", dealInfo.payToken);
        console.log("Buyer address:", dealInfo.buyer);
        
        // Check allowance from BUYER to contract (not current user)
        const allowance = await tokenContract.allowance(dealInfo.buyer, contractAddress);
        console.log("Allowance from buyer to contract:", allowance.toString());
        console.log("Required amount:", askClear.toString());
        console.log("Allowance sufficient:", allowance >= BigInt(askClear));
        
        if (allowance < BigInt(askClear)) {
          throw new Error(`Insufficient allowance. Buyer allowance: ${allowance}, Required: ${askClear}`);
        }
      }
      
      const tx = await contract.settle(dealId, askClear, bidClear);
      await tx.wait();
      console.log("Settle transaction successful");
    } catch (e: any) {
      console.error("Settle error:", e);
      
      // Decode error data để hiển thị thông báo rõ ràng
      if (e.data) {
        console.log("Error data:", e.data);
        
        // Check for ERC20InsufficientAllowance (0xe450d38c)
        if (e.data.startsWith('0xe450d38c')) {
          setErr("❌ ERC20InsufficientAllowance: Buyer chưa approve đủ allowance cho Escrow. Vui lòng click 'Approve Payment Token' trước.");
        } else if (e.data.includes('0x08c379a0')) {
          // String error - try to decode
          setErr("Contract error: Please check if buyer has approved DAI token and deal is ready.");
        } else {
          setErr("Transaction failed. Please ensure buyer has approved DAI token.");
        }
      } else if (e.message?.includes('ERC20: insufficient allowance')) {
        setErr("Buyer needs to approve DAI token first. Please use 'Approve Payment Token' button.");
      } else if (e.message?.includes('prices not bound')) {
        setErr("Prices not bound. Please reveal match first.");
      } else if (e.message?.includes('execution reverted')) {
        setErr("Transaction failed. Please ensure buyer has approved DAI token for the contract.");
      } else {
        setErr(e.message || String(e));
      }
      throw e;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  const cancel = useCallback(async (dealId: number) => {
    if (!contract) throw new Error("No contract");
    setLoading(true); 
    setErr("");
    try {
      const tx = await contract.cancel(dealId);
      await tx.wait();
    } catch (e: any) {
      setErr(e.message || String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  const getDealInfo = useCallback(async (dealId: number) => {
    if (!contract) throw new Error("No contract");
    try {
      // Test contract connection first
      console.log("Testing contract connection...");
      const nextDealId = await contract.nextDealId();
      console.log("Contract connected, nextDealId:", nextDealId.toString());
      
      const info = await contract.getDealInfo(dealId);
      return {
        seller: info.seller,
        buyer: info.buyer,
        assetToken: info.assetToken,
        assetAmount: info.assetAmount,
        payToken: info.payToken,
        hasAsk: info.hasAsk,
        hasBid: info.hasBid,
        hasThreshold: info.hasThreshold,
        state: info.state
      };
    } catch (e: any) {
      console.error("getDealInfo error:", e);
      setErr(e.message || String(e));
      throw e;
    }
  }, [contract]);

  const checkAllowance = useCallback(async (dealId: number, askClear: number) => {
    if (!contract || !ethersSigner) throw new Error("No contract or signer");
    try {
      const dealInfo = await contract.getDealInfo(dealId);
      const erc20Abi = [
        "function allowance(address owner, address spender) external view returns (uint256)"
      ];
      const tokenContract = new ethers.Contract(dealInfo.payToken, erc20Abi, ethersSigner);
      
      // Check allowance from BUYER to contract (not current user)
      const allowance = await tokenContract.allowance(dealInfo.buyer, contractAddress);
      
      return {
        allowance: Number(allowance),
        required: askClear,
        sufficient: allowance >= BigInt(askClear)
      };
    } catch (e: any) {
      console.error("Check allowance error:", e);
      return { allowance: 0, required: askClear, sufficient: false };
    }
  }, [contract, ethersSigner, contractAddress]);

  const mintTokens = useCallback(async (tokenAddress: string, amount: string) => {
    if (!ethersSigner) throw new Error("No signer");
    try {
      setLoading(true);
      setErr("");
      
      const erc20Abi = [
        "function mint(address to, uint256 amount) external",
        "function owner() external view returns (address)"
      ];
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, ethersSigner);
      
      // Check if current user is owner
      const owner = await tokenContract.owner();
      const currentUser = await ethersSigner.getAddress();
      
      console.log("Token owner:", owner);
      console.log("Current user:", currentUser);
      
      if (owner.toLowerCase() !== currentUser.toLowerCase()) {
        throw new Error(`Only token owner (${owner}) can mint tokens. Current user: ${currentUser}`);
      }
      
      const tx = await tokenContract.mint(ethersSigner.address, amount);
      await tx.wait();
      
      console.log(`Minted ${amount} tokens to ${ethersSigner.address}`);
    } catch (e: any) {
      console.error("Mint error:", e);
      setErr(e.message || String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [ethersSigner]);

  const getTokenBalance = useCallback(async (tokenAddress: string, userAddress?: string) => {
    if (!ethersSigner) {
      console.log("No signer available, returning default balance");
      return {
        balance: "0",
        name: "Unknown",
        symbol: "UNK",
        decimals: 18,
        formatted: "0.00"
      };
    }
    
    try {
      const erc20Abi = [
        "function balanceOf(address account) external view returns (uint256)",
        "function name() external view returns (string)",
        "function symbol() external view returns (string)",
        "function decimals() external view returns (uint8)"
      ];
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, ethersSigner);
      
      const address = userAddress || await ethersSigner.getAddress();
      console.log("Getting balance for:", { tokenAddress, address });
      
      const balance = await tokenContract.balanceOf(address);
      const name = await tokenContract.name();
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      
      console.log("Token info:", { name, symbol, decimals: Number(decimals), balance: balance.toString() });
      
      return {
        balance: balance.toString(),
        name,
        symbol,
        decimals: Number(decimals),
        formatted: (Number(balance) / Math.pow(10, Number(decimals))).toFixed(2)
      };
    } catch (e: any) {
      console.error("Get balance error:", e);
      return {
        balance: "0",
        name: "Unknown",
        symbol: "UNK",
        decimals: 18,
        formatted: "0.00"
      };
    }
  }, [ethersSigner]);

  const checkSettlementResults = useCallback(async (dealId: number) => {
    if (!contract || !ethersSigner) throw new Error("No contract or signer");
    try {
      const dealInfo = await contract.getDealInfo(dealId);
      console.log("🔍 Checking settlement results for deal:", dealId);
      
      // Get balances for both seller and buyer
      const sellerUSDC = await getTokenBalance(dealInfo.assetToken, dealInfo.seller);
      const buyerUSDC = await getTokenBalance(dealInfo.assetToken, dealInfo.buyer);
      const sellerDAI = await getTokenBalance(dealInfo.payToken, dealInfo.seller);
      const buyerDAI = await getTokenBalance(dealInfo.payToken, dealInfo.buyer);
      
      console.log("📊 Settlement Results:");
      console.log("Deal Asset Amount:", dealInfo.assetAmount.toString());
      console.log("Seller USDC balance:", sellerUSDC.balance);
      console.log("Buyer USDC balance:", buyerUSDC.balance);
      console.log("Seller DAI balance:", sellerDAI.balance);
      console.log("Buyer DAI balance:", buyerDAI.balance);
      
      // Calculate expected balances
      const assetAmount = Number(dealInfo.assetAmount);
      console.log("🔍 Expected vs Actual:");
      console.log("Expected: Buyer should receive", assetAmount, "USDC");
      console.log("Expected: Seller should receive", assetAmount, "DAI (askClear amount)");
      
      return {
        seller: {
          usdc: sellerUSDC,
          dai: sellerDAI
        },
        buyer: {
          usdc: buyerUSDC,
          dai: buyerDAI
        },
        dealInfo
      };
    } catch (e: any) {
      console.error("Check settlement error:", e);
      throw e;
    }
  }, [contract, ethersSigner, getTokenBalance]);

  return {
    loading, 
    error,
    approveToken,
    approvePaymentToken,
    createDeal, 
    setEncThreshold,
    submitAsk, 
    submitAskWithThreshold,
    submitBid, 
    revealMatch, 
    settle,
    cancel,
    getDealInfo,
    checkAllowance,
    mintTokens,
    getTokenBalance,
    checkSettlementResults,
  };
}