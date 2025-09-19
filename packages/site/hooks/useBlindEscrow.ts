"use client";

import { useCallback, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useMetaMaskEthersSigner } from "./metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@fhevm/react";
import { useInMemoryStorage } from "./useInMemoryStorage";

// Import ABI
import { BlindEscrowABI } from "@/abi/BlindEscrowABI";

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

  // revealMatch: gọi function và trả về ebool (cần decrypt ở client)
  const revealMatch = useCallback(async (dealId: number) => {
    if (!contract) throw new Error("No contract");
    setLoading(true); 
    setErr("");
    try {
      // Gọi revealMatch function - trả về ebool
      const matchedEbool = await contract.revealMatch(dealId);
      
      // TODO: Cần decrypt ebool ở client side qua relayer
      // Hiện tại chỉ trả về ebool handle
      return { 
        matched: matchedEbool, // ebool handle, cần decrypt
        askClear: 0, // Cần decrypt từ contract
        bidClear: 0  // Cần decrypt từ contract
      };
    } catch (e: any) {
      setErr(e.message || String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  const settle = useCallback(async (dealId: number, askClear: number, bidClear: number) => {
    if (!contract) throw new Error("No contract");
    setLoading(true); 
    setErr("");
    try {
      const tx = await contract.settle(dealId, askClear, bidClear);
      await tx.wait();
    } catch (e: any) {
      setErr(e.message || String(e));
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

  return {
    loading, 
    error,
    approveToken,
    createDeal, 
    setEncThreshold,
    submitAsk, 
    submitAskWithThreshold,
    submitBid, 
    revealMatch, 
    settle,
    cancel,
  };
}