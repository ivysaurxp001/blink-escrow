import { useCallback } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { Address } from "@/lib/types";
import { BLIND_ESCROW_ADDR } from "../config/contracts";

const ERC20_ABI = [
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

export function useAllowances() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const getAllowance = useCallback(async (tokenAddress: Address, spender: Address = BLIND_ESCROW_ADDR as Address) => {
    if (!address || !walletClient) return BigInt(0);
    
    try {
      const provider = new ethers.BrowserProvider(walletClient.transport as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer as any);
      
      const allowance = await contract.allowance(address, spender);
      return BigInt(allowance.toString());
    } catch (error) {
      console.error("Get allowance error:", error);
      return BigInt(0);
    }
  }, [address, walletClient]);

  const approve = useCallback(async (tokenAddress: Address, amount: bigint, spender: Address = BLIND_ESCROW_ADDR as Address) => {
    if (!address || !walletClient) throw new Error("No wallet connected");
    
    const provider = new ethers.BrowserProvider(walletClient.transport as any);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer as any);
    
    const tx = await contract.approve(spender, amount);
    await tx.wait();
    return tx.hash;
  }, [address, walletClient]);

  const getBalance = useCallback(async (tokenAddress: Address) => {
    if (!address || !walletClient) return BigInt(0);
    
    try {
      const provider = new ethers.BrowserProvider(walletClient.transport as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer as any);
      
      const balance = await contract.balanceOf(address);
      return BigInt(balance.toString());
    } catch (error) {
      console.error("Get balance error:", error);
      return BigInt(0);
    }
  }, [address, walletClient]);

  const getTokenInfo = useCallback(async (tokenAddress: Address) => {
    if (!walletClient) throw new Error("No wallet connected");
    
    const provider = new ethers.BrowserProvider(walletClient.transport as any);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer as any);
    
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(), 
      contract.decimals()
    ]);
    
    return { name, symbol, decimals: Number(decimals) };
  }, [walletClient]);

  return {
    getAllowance,
    approve,
    getBalance,
    getTokenInfo,
  };
}
