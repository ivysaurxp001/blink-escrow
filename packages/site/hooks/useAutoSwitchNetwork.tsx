"use client";

import { useEffect, useState } from "react";
import { useMetaMaskEthersSigner } from "./metamask/useMetaMaskEthersSigner";

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CONFIG = {
  chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
  chainName: "Sepolia Test Network",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://sepolia.infura.io/v3/"],
  blockExplorerUrls: ["https://sepolia.etherscan.io/"],
};

export function useAutoSwitchNetwork() {
  const { chainId, isConnected, ethersBrowserProvider } = useMetaMaskEthersSigner();
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const switchToSepolia = async () => {
    if (!ethersBrowserProvider) return;

    setIsSwitching(true);
    setSwitchError(null);

    try {
      // Try to switch to Sepolia
      await ethersBrowserProvider.send("wallet_switchEthereumChain", [
        { chainId: SEPOLIA_CONFIG.chainId },
      ]);
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          // Add Sepolia network to MetaMask
          await ethersBrowserProvider.send("wallet_addEthereumChain", [
            SEPOLIA_CONFIG,
          ]);
        } catch (addError: any) {
          setSwitchError(`Failed to add Sepolia network: ${addError.message}`);
        }
      } else {
        setSwitchError(`Failed to switch to Sepolia: ${switchError.message}`);
      }
    } finally {
      setIsSwitching(false);
    }
  };

  // Auto-switch when connected but not on Sepolia
  useEffect(() => {
    if (isConnected && chainId && chainId !== SEPOLIA_CHAIN_ID) {
      // Don't auto-switch immediately, let user see the warning first
      // switchToSepolia();
    }
  }, [isConnected, chainId]);

  return {
    isOnSepolia: chainId === SEPOLIA_CHAIN_ID,
    isSwitching,
    switchError,
    switchToSepolia,
    chainId,
  };
}
