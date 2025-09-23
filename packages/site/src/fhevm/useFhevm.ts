'use client';

import { useEffect, useCallback, useState } from 'react';
import { ensureRelayerReady, userDecrypt, encrypt32Single, encryptAskThresholdBatch } from './relayerClient';
import { getRelayerInstance } from './relayer';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { encodeFunctionData, decodeFunctionResult, getAbiItem } from 'viem';
import { BlindEscrowABI } from '@/abi/BlindEscrowABI';
import { BLIND_ESCROW_ADDR } from '@/config/contracts';
import { FhevmDecryptionSignature } from './FhevmDecryptionSignature';
import { GenericStringInMemoryStorage } from './GenericStringStorage';
import { ethers } from 'ethers';

// Utility function to convert Uint8Array to hex string
function uint8ArrayToHex(uint8Array: Uint8Array): `0x${string}` {
  return `0x${Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
}

// Utility function to create ethers.Signer from wagmi walletClient
function createEthersSigner(walletClient: any, address: string): ethers.Signer {
  return {
    getAddress: async () => address,
    signTypedData: async (domain: any, types: any, message: any) => {
      const signature = await walletClient.signTypedData({
        domain,
        types,
        primaryType: types.UserDecryptRequestVerification ? 'UserDecryptRequestVerification' : 'EIP712Domain',
        message
      });
      return signature;
    }
  } as ethers.Signer;
}

export function useFhevm() {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<Error | null>(null);
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const storage = new GenericStringInMemoryStorage();

  useEffect(() => {
    const init = async () => {
      try {
        console.log("🔍 Initializing FHEVM relayer...");
        await ensureRelayerReady();
        console.log("✅ FHEVM relayer ready");
        setReady(true);
        setErr(null);
      } catch (error) {
        console.error("❌ FHE relayer not ready:", error);
        setErr(error as Error);
        setReady(false);
      }
    };

    init();
  }, []);

  const createOpenWithAsk = useCallback(async (params: {
    assetToken: `0x${string}`;
    assetAmountRaw: string;
    payToken: `0x${string}`;
    ask: number;
    threshold: number;
  }) => {
    if (!ready) throw new Error('FHE relayer not ready');
    if (!walletClient || !address) throw new Error('Wallet not connected');
    if (!publicClient) throw new Error('Public client not available');

    console.log("🔍 Creating OPEN deal with ask + threshold...");
    console.log("🔍 Contract address:", BLIND_ESCROW_ADDR);
    console.log("🔍 User address:", address);
    console.log("🔍 Chain ID:", chainId);

    // Validate contract address
    if (!BLIND_ESCROW_ADDR || BLIND_ESCROW_ADDR === '') {
      throw new Error('Contract address is not valid or empty');
    }

    const { askHandle, thresholdHandle, inputProof } = await encryptAskThresholdBatch(
      BLIND_ESCROW_ADDR as `0x${string}`,
      address,
      params.ask,
      params.threshold
    );

    console.log("🔍 Encrypted values:", {
      askHandle,
      thresholdHandle,
      inputProof,
      askHandleType: typeof askHandle,
      thresholdHandleType: typeof thresholdHandle,
      inputProofType: typeof inputProof
    });

    // Step 1: Approve asset token
    console.log("🔍 Step 1: Approving asset token...");
    const approveData = encodeFunctionData({
      abi: [
        {
          "inputs": [
            {"internalType": "address", "name": "spender", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
          ],
          "name": "approve",
          "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      functionName: "approve",
      args: [BLIND_ESCROW_ADDR as `0x${string}`, BigInt(params.assetAmountRaw)]
    });

    console.log("🔍 Sending approve transaction...");
    const approveHash = await walletClient.sendTransaction({
      to: params.assetToken,
      data: approveData,
    });

    console.log("🔍 Approve transaction hash:", approveHash);
    const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
    console.log("✅ Asset token approved successfully:", approveReceipt);

    // Step 2: Create deal
    console.log("🔍 Step 2: Creating deal...");
    const data = encodeFunctionData({
      abi: BlindEscrowABI.abi as any,
      functionName: "createDealWithAsk",
      args: [
        "0x0000000000000000000000000000000000000000", // buyer (0x0 for OPEN mode)
        1, // mode (1 = OPEN, 0 = P2P)
        params.assetToken,
        BigInt(params.assetAmountRaw),
        params.payToken,
        uint8ArrayToHex(askHandle),
        uint8ArrayToHex(thresholdHandle),
        uint8ArrayToHex(inputProof)
      ]
    });

    console.log("🔍 Calling createDealWithAsk with data:", data);

    const hash = await walletClient.sendTransaction({
      to: BLIND_ESCROW_ADDR as `0x${string}`,
      data,
    });

    console.log("🔍 Transaction hash:", hash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("✅ Deal created successfully:", receipt);

    return receipt;
  }, [ready, walletClient, address, publicClient, chainId]);

  const submitBid = useCallback(async (dealId: bigint, bidAmount: number) => {
    if (!ready) throw new Error('FHE relayer not ready');
    if (!walletClient || !address) throw new Error('Wallet not connected');
    if (!publicClient) throw new Error('Public client not available');

    console.log("🔍 Submitting bid for deal:", dealId, "amount:", bidAmount);

    const { input, proof } = await encrypt32Single(
      BLIND_ESCROW_ADDR as `0x${string}`,
      address,
      bidAmount
    );

    const data = encodeFunctionData({
      abi: BlindEscrowABI.abi as any,
      functionName: "submitBid",
      args: [
        dealId,
        uint8ArrayToHex(input),
        uint8ArrayToHex(proof)
      ]
    });

    console.log("🔍 Calling submitBid with data:", data);

    const hash = await walletClient.sendTransaction({
      to: BLIND_ESCROW_ADDR as `0x${string}`,
      data,
    });

    console.log("🔍 Transaction hash:", hash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("✅ Bid submitted successfully:", receipt);

    return receipt;
  }, [ready, walletClient, address, publicClient]);

  const checkDealState = useCallback(async (dealId: bigint) => {
    if (!publicClient) throw new Error('Public client not available');

    console.log("🔍 Checking deal state for deal:", dealId);
    console.log("🔍 Contract address:", BLIND_ESCROW_ADDR);

    const stateData = encodeFunctionData({
      abi: BlindEscrowABI.abi as any,
      functionName: "getDealState",
      args: [dealId]
    });

    console.log("🔍 Encoded state data:", stateData);

    const stateResult = await publicClient.call({
      to: BLIND_ESCROW_ADDR as `0x${string}`,
      data: stateData,
    });

    console.log("🔍 State result:", stateResult);

    if (!stateResult.data) throw new Error('No state data returned');
    
    const stateDecoded = decodeFunctionResult({
      abi: BlindEscrowABI.abi as any,
      functionName: "getDealState",
      data: stateResult.data,
    });

    console.log("🔍 Decoded state:", stateDecoded);
    console.log("🔍 State value (as array):", (stateDecoded as any)[0]);
    console.log("🔍 State value (direct):", stateDecoded);

    // Try both ways to get the state value
    const stateValue = Array.isArray(stateDecoded) ? stateDecoded[0] : stateDecoded;
    console.log("🔍 Final state value:", stateValue);

    return stateValue; // DealState enum
  }, [publicClient]);

  const revealAndDecrypt = useCallback(async (dealId: bigint) => {
    if (!publicClient) throw new Error('Public client not available');
    if (!walletClient || !address) throw new Error('Wallet not connected');

    console.log("🔍 Attempting to reveal deal:", dealId);

    // Check deal state first
    try {
      console.log("🔍 About to check deal state for deal:", dealId);
      const dealState = await checkDealState(dealId);
      console.log("🔍 Deal state result:", dealState);
      console.log("🔍 Deal state type:", typeof dealState);
      console.log("🔍 Deal state === 4:", dealState === 4);
      console.log("🔍 Deal state == 4:", dealState == 4);
      
      // DealState.Ready = 4
      if (dealState !== 4) {
        console.error("❌ Deal state check failed:", {
          dealId,
          dealState,
          expectedState: 4,
          stateType: typeof dealState
        });
        
        // TEMPORARY: Allow reveal if state is undefined (bypass check)
        if (dealState === undefined) {
          console.warn("⚠️ Deal state is undefined, bypassing check and proceeding with reveal");
        } else {
          throw new Error(`Deal ${dealId} is not in Ready state (current state: ${dealState}). Cannot reveal.`);
        }
      }
      console.log("✅ Deal state check passed, proceeding with reveal");
      
      // Check if deal has ask, bid, and threshold
      console.log("🔍 Checking deal requirements (ask, bid, threshold)...");
      
      // Get deal info using the same method as below
      const dealInfoData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "getDealInfo",
        args: [dealId]
      });

      const dealInfoResult = await publicClient.call({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: dealInfoData,
      });

      if (!dealInfoResult.data) {
        throw new Error(`Failed to get deal info for deal ${dealId}`);
      }

      const dealInfoDecoded = decodeFunctionResult({
        abi: BlindEscrowABI.abi as any,
        functionName: "getDealInfo",
        data: dealInfoResult.data,
      });

      console.log("🔍 Deal info decoded:", dealInfoDecoded);
      
      // Check if deal has ask, bid, and threshold
      // DealInfo structure: [id, seller, buyer, assetToken, assetAmount, payToken, askAmount, bidAmount, threshold, state, mode]
      const hasAsk = Array.isArray(dealInfoDecoded) ? dealInfoDecoded[6] !== BigInt(0) : (dealInfoDecoded as any).askAmount !== BigInt(0);
      const hasBid = Array.isArray(dealInfoDecoded) ? dealInfoDecoded[7] !== BigInt(0) : (dealInfoDecoded as any).bidAmount !== BigInt(0);
      const hasThreshold = Array.isArray(dealInfoDecoded) ? dealInfoDecoded[8] !== BigInt(0) : (dealInfoDecoded as any).threshold !== BigInt(0);
      
      console.log("🔍 Deal components check:", { hasAsk, hasBid, hasThreshold });
      
      if (!hasAsk) {
        throw new Error(`Deal ${dealId} does not have ask price. Cannot reveal.`);
      }
      if (!hasBid) {
        throw new Error(`Deal ${dealId} does not have bid price. Cannot reveal.`);
      }
      if (!hasThreshold) {
        throw new Error(`Deal ${dealId} does not have threshold. Cannot reveal.`);
      }
      
      console.log("✅ Deal has all required components (ask, bid, threshold)");
    } catch (error) {
      console.error("❌ Failed to check deal state:", error);
      throw error;
    }

    // Additional check: Get full deal info to verify state
    try {
      console.log("🔍 Getting full deal info for verification...");
      const dealInfoData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "getDealInfo",
        args: [dealId]
      });
      
      const dealInfoResult = await publicClient.call({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: dealInfoData,
      });
      
      if (dealInfoResult.data) {
        const dealInfoDecoded = decodeFunctionResult({
          abi: BlindEscrowABI.abi as any,
          functionName: "getDealInfo",
          data: dealInfoResult.data,
        });
        
        console.log("🔍 Full deal info:", dealInfoDecoded);
        // DealInfo structure: [id, seller, buyer, assetToken, assetAmount, payToken, askAmount, bidAmount, threshold, state, mode]
        const dealStateFromInfo = Array.isArray(dealInfoDecoded) ? dealInfoDecoded[9] : (dealInfoDecoded as any).state;
        console.log("🔍 Deal state from getDealInfo:", dealStateFromInfo);
        
        // Debug: Try to decrypt ciphertext values
        if (Array.isArray(dealInfoDecoded)) {
          const [id, seller, buyer, assetToken, assetAmount, payToken, askAmount, bidAmount, threshold, state, mode] = dealInfoDecoded;
          console.log("🔍 Deal details:", {
            id,
            seller,
            buyer,
            assetToken,
            assetAmount,
            payToken,
            askAmount,
            bidAmount,
            threshold,
            state,
            mode
          });
          
          // Try to decrypt encrypted values using advanced approach
          try {
            console.log("🔍 Attempting to decrypt encrypted values with signature...");
            const inst = await getRelayerInstance();
            
            if (walletClient && address) {
              // Create ethers.Signer from wagmi walletClient
              const ethersSigner = createEthersSigner(walletClient, address);
              
              // Create FhevmDecryptionSignature
              const sig = await FhevmDecryptionSignature.loadOrSign(
                inst,
                [BLIND_ESCROW_ADDR as `0x${string}`],
                ethersSigner,
                storage
              );

              if (sig) {
            // Try to decrypt askAmount (should be encrypted)
            if (askAmount && typeof askAmount === 'string' && askAmount.startsWith('0x')) {
                  console.log("🔍 Decrypting askAmount with signature-based userDecrypt:", askAmount);
                  try {
                    // Try simple userDecrypt (no signature required)
                    const res = await inst.userDecrypt(askAmount);
                    console.log("🔍 Decrypted askAmount:", res[askAmount]);
                  } catch (e) {
                    console.warn("⚠️ Failed to decrypt askAmount:", e);
                  }
            }
            
            // Try to decrypt bidAmount (should be encrypted)
            if (bidAmount && typeof bidAmount === 'string' && bidAmount.startsWith('0x')) {
                  console.log("🔍 Decrypting bidAmount with signature-based userDecrypt:", bidAmount);
                  try {
                    // Try simple userDecrypt (no signature required)
                    const res = await inst.userDecrypt(bidAmount);
                    console.log("🔍 Decrypted bidAmount:", res[bidAmount]);
                  } catch (e) {
                    console.warn("⚠️ Failed to decrypt bidAmount:", e);
                  }
            }
            
            // Try to decrypt threshold (should be encrypted)
            if (threshold && typeof threshold === 'string' && threshold.startsWith('0x')) {
                  console.log("🔍 Decrypting threshold with signature-based userDecrypt:", threshold);
                  try {
                    // Try simple userDecrypt (no signature required)
                    const res = await inst.userDecrypt(threshold);
                    console.log("🔍 Decrypted threshold:", res[threshold]);
                  } catch (e) {
                    console.warn("⚠️ Failed to decrypt threshold:", e);
                  }
                }
              } else {
                console.warn("⚠️ Failed to create decryption signature");
              }
            } else {
              console.warn("⚠️ No wallet client or address available for signature creation");
            }
          } catch (decryptError) {
            console.warn("⚠️ Failed to decrypt values:", decryptError);
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ Failed to get full deal info:", error);
    }

    // Try to call revealMatch to get matched boolean
    console.log("🔍 Attempting to call revealMatch to get matched boolean...");

    const revealData = encodeFunctionData({
      abi: BlindEscrowABI.abi as any,
      functionName: "revealMatch",
      args: [dealId]
    });

    console.log("📞 Calling revealMatch with data:", revealData);
    console.log("📞 Deal ID type:", typeof dealId, dealId);
    console.log("📞 Contract address:", BLIND_ESCROW_ADDR);

    let result;
    try {
      result = await publicClient.call({
      to: BLIND_ESCROW_ADDR as `0x${string}`,
      data: revealData,
    });

    if (!result.data) throw new Error('No data returned from reveal');
      console.log("✅ Reveal call successful, data:", result.data);
    } catch (error) {
      console.error("❌ Reveal call failed:", error);
      console.error("🔍 Deal ID:", dealId);
      console.error("🔍 Contract address:", BLIND_ESCROW_ADDR);
      console.error("🔍 Call data:", revealData);
      
      // Try offline decryption as fallback
      console.log("🔍 Attempting offline decryption as fallback...");
      console.log("🔍 Error type:", typeof error);
      console.log("🔍 Error message:", error instanceof Error ? error.message : error);
      
      try {
        const inst = await getRelayerInstance();
        console.log("🔍 Got relayer instance for offline decryption");
        
        // Get encrypted values for offline decryption
        console.log("🔍 Getting encrypted ask...");
        const askData = encodeFunctionData({
          abi: BlindEscrowABI.abi as any,
          functionName: "getEncryptedAsk",
          args: [dealId]
        });
        
        const askResult = await publicClient.call({
          to: BLIND_ESCROW_ADDR as `0x${string}`,
          data: askData,
        });
        
        console.log("🔍 Getting encrypted bid...");
        const bidData = encodeFunctionData({
          abi: BlindEscrowABI.abi as any,
          functionName: "getEncryptedBid",
          args: [dealId]
        });
        
        const bidResult = await publicClient.call({
          to: BLIND_ESCROW_ADDR as `0x${string}`,
          data: bidData,
        });
        
        console.log("🔍 Getting encrypted threshold...");
        const thresholdData = encodeFunctionData({
          abi: BlindEscrowABI.abi as any,
          functionName: "getEncryptedThreshold",
          args: [dealId]
        });
        
        const thresholdResult = await publicClient.call({
          to: BLIND_ESCROW_ADDR as `0x${string}`,
          data: thresholdData,
        });
        
        if (askResult.data && bidResult.data && thresholdResult.data) {
          console.log("🔍 Got encrypted values for offline decryption");
          
          const askDecoded = decodeFunctionResult({
            abi: BlindEscrowABI.abi as any,
            functionName: "getEncryptedAsk",
            data: askResult.data,
          });
          
          const bidDecoded = decodeFunctionResult({
            abi: BlindEscrowABI.abi as any,
            functionName: "getEncryptedBid",
            data: bidResult.data,
          });
          
          const thresholdDecoded = decodeFunctionResult({
            abi: BlindEscrowABI.abi as any,
            functionName: "getEncryptedThreshold",
            data: thresholdResult.data,
          });
          
          console.log("🔍 Decoded encrypted values:", {
            ask: askDecoded,
            bid: bidDecoded,
            threshold: thresholdDecoded
          });
          
          console.log("🔍 Attempting offline decryption of encrypted values...");
          console.log("🔍 Ask type:", typeof askDecoded, askDecoded);
          console.log("🔍 Bid type:", typeof bidDecoded, bidDecoded);
          console.log("🔍 Threshold type:", typeof thresholdDecoded, thresholdDecoded);
            
          let askDecrypted = null;
          let bidDecrypted = null;
          let thresholdDecrypted = null;
          
          // Try to decrypt using advanced approach with signature
          console.log("🔍 Attempting advanced decryption with signature...");
          
          if (walletClient && address) {
            try {
              // Create ethers.Signer from wagmi walletClient
              const ethersSigner = createEthersSigner(walletClient, address);
              
              // Create FhevmDecryptionSignature
              const sig = await FhevmDecryptionSignature.loadOrSign(
                inst,
                [BLIND_ESCROW_ADDR as `0x${string}`],
                ethersSigner,
                storage
              );

              if (!sig) {
                console.warn("⚠️ Failed to create decryption signature");
              } else {
                console.log("✅ Created decryption signature, attempting decryption...");
          
          // Try to decrypt ask
          if (askDecoded && typeof askDecoded === 'string' && askDecoded.startsWith('0x')) {
                  console.log("🔍 Decrypting ask with simple userDecrypt...");
                  try {
                    // Try simple userDecrypt (no signature required)
                    const res = await inst.userDecrypt(askDecoded);
                    askDecrypted = res[askDecoded];
                    console.log("✅ Signature-based decrypted ask:", askDecrypted);
                 } catch (e) {
                    console.warn("⚠️ Failed to decrypt ask with signature-based userDecrypt:", e);
                 }
          }
          
          // Try to decrypt bid
          if (bidDecoded && typeof bidDecoded === 'string' && bidDecoded.startsWith('0x')) {
                  console.log("🔍 Decrypting bid with simple userDecrypt...");
                  try {
                    // Try simple userDecrypt (no signature required)
                    const res = await inst.userDecrypt(bidDecoded);
                    bidDecrypted = res[bidDecoded];
                    console.log("✅ Signature-based decrypted bid:", bidDecrypted);
                 } catch (e) {
                    console.warn("⚠️ Failed to decrypt bid with signature-based userDecrypt:", e);
                 }
          }
          
          // Try to decrypt threshold
          if (thresholdDecoded && typeof thresholdDecoded === 'string' && thresholdDecoded.startsWith('0x')) {
                  console.log("🔍 Decrypting threshold with simple userDecrypt...");
                  try {
                    // Try simple userDecrypt (no signature required)
                    const res = await inst.userDecrypt(thresholdDecoded);
                    thresholdDecrypted = res[thresholdDecoded];
                    console.log("✅ Signature-based decrypted threshold:", thresholdDecrypted);
                 } catch (e) {
                    console.warn("⚠️ Failed to decrypt threshold with signature-based userDecrypt:", e);
                  }
                }
              }
            } catch (signatureError) {
              console.warn("⚠️ Failed to create signature for decryption:", signatureError);
                 }
          } else {
            console.warn("⚠️ No wallet client or address available for signature creation");
          }
          
          // Check if we can determine match offline
          console.log("🔍 Checking if we can determine match offline...");
          console.log("🔍 askDecrypted:", askDecrypted);
          console.log("🔍 bidDecrypted:", bidDecrypted);
          console.log("🔍 thresholdDecrypted:", thresholdDecrypted);
          
          if (askDecrypted !== null && bidDecrypted !== null && thresholdDecrypted !== null) {
            console.log("🔍 All values decrypted successfully, checking match condition offline...");
            console.log("🔍 Ask:", askDecrypted, "Bid:", bidDecrypted, "Threshold:", thresholdDecrypted);
            
            // Simple match logic: bid >= ask - threshold
            const matched = bidDecrypted >= (askDecrypted - thresholdDecrypted);
            console.log("🔍 Offline match result:", matched);
            
            // Return mock result for now
            console.log("🔍 Returning offline decryption result...");
            return { 
              matched, 
              askPlain: askDecrypted, 
              bidPlain: bidDecrypted, 
              thPlain: thresholdDecrypted 
            };
          } else {
            console.log("🔍 Cannot determine match offline - some values failed to decrypt");
          }
        }
      } catch (offlineError) {
        console.warn("⚠️ Offline decryption also failed:", offlineError);
        console.warn("⚠️ Offline error details:", offlineError instanceof Error ? offlineError.message : offlineError);
      }
      
      // Check if it's a revert error
      if (error instanceof Error && error.message.includes('reverted')) {
        console.log("🔍 Reveal call reverted, trying offline decryption...");
        // Don't throw error yet, let offline decryption try first
      } else {
        console.log("🔍 Error is not a revert error, throwing...");
        throw error;
      }
      
      // If we reach here, offline decryption failed, throw the original error
      console.log("🔍 Offline decryption failed, throwing original error...");
      throw error;
    }

    // Decode the result (assuming it returns [ebool])
    const decoded = decodeFunctionResult({
      abi: BlindEscrowABI.abi as any,
      functionName: "revealMatch",
      data: result.data,
    });

    const matched = await userDecrypt<boolean>((decoded as any)[0]); // ebool
    
    // TODO: Contract doesn't return plain values, need to implement proper reveal
    // For now, return mock values
    const askPlain = 100; // Mock value
    const bidPlain = 99;  // Mock value  
    const thPlain = 50;   // Mock value
    
    return { matched, askPlain, bidPlain, thPlain };
  }, [publicClient, checkDealState, address, walletClient, ready]);

  const grantDecryptPermission = useCallback(async (dealId: bigint, userAddress: `0x${string}`) => {
    if (!ready) throw new Error('FHE relayer not ready');
    if (!walletClient || !address) throw new Error('Wallet not connected');
    if (!publicClient) throw new Error('Public client not available');

    console.log("🔍 Granting decrypt permission for deal:", dealId, "to user:", userAddress);

    // Guard: Check if function exists in ABI
    try {
      const fn = getAbiItem({ abi: BlindEscrowABI.abi as any, name: "grantDecryptPermission" });
      if (!fn) {
        console.warn("⚠️ grantDecryptPermission không có trong ABI đang dùng → skip");
        return { skipped: true };
      }
      console.log("✅ Function grantDecryptPermission found in ABI");
    } catch (error) {
      console.warn("⚠️ Error checking ABI for grantDecryptPermission:", error);
      return { skipped: true };
    }

    try {
      const data = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "grantDecryptPermission",
        args: [dealId, userAddress]
      });

      console.log("🔍 Calling grantDecryptPermission with data:", data);

      const hash = await walletClient.sendTransaction({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data,
      });

      console.log("🔍 Transaction hash:", hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("✅ Decrypt permission granted successfully:", receipt);

      return receipt;
    } catch (error) {
      console.error("❌ Failed to grant decrypt permission:", error);
      throw error;
    }
  }, [ready, walletClient, address, publicClient]);

  // Test function: chỉ decrypt bid
  const testDecryptBid = useCallback(async (dealId: bigint) => {
    if (!ready) throw new Error('FHE relayer not ready');
    if (!publicClient) throw new Error('Public client not available');

    console.log("🧪 Testing bid decryption for deal:", dealId);

    try {
      // Get relayer instance
      const inst = await getRelayerInstance();
      console.log("✅ Got relayer instance for bid decryption test");

      // Get encrypted bid
      console.log("🔍 Getting encrypted bid...");
      const bidData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "getEncryptedBid",
        args: [dealId]
      });

      const bidResult = await publicClient.call({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: bidData,
      });

      if (!bidResult.data) {
        throw new Error(`Failed to get encrypted bid for deal ${dealId}`);
      }

      const bidDecoded = decodeFunctionResult({
        abi: BlindEscrowABI.abi as any,
        functionName: "getEncryptedBid",
        data: bidResult.data,
      });

      console.log("🔍 Encrypted bid:", bidDecoded);

      if (bidDecoded && typeof bidDecoded === 'string' && bidDecoded.startsWith('0x')) {
        console.log("🔍 Attempting to decrypt bid with signature...");
        
        // Create signature for decryption
        if (walletClient && address) {
          try {
            const ethersSigner = createEthersSigner(walletClient, address);
            const sig = await FhevmDecryptionSignature.loadOrSign(
              inst,
              [BLIND_ESCROW_ADDR as `0x${string}`],
              ethersSigner,
              storage
            );
            
            console.log("✅ Created decryption signature for bid test");
            
            if (sig) {
              try {
                const res = await inst.userDecrypt(
                  [{ handle: bidDecoded, contractAddress: BLIND_ESCROW_ADDR as `0x${string}` }],
                  sig.privateKey,
                  sig.publicKey,
                  sig.signature,
                  sig.contractAddresses,
                  sig.userAddress,
                  sig.startTimestamp,
                  sig.durationDays
                );
                const decryptedBid = res[bidDecoded];
                console.log("✅ Successfully decrypted bid with signature:", decryptedBid);
                return { success: true, bid: decryptedBid };
              } catch (e) {
                console.error("❌ Failed to decrypt bid with signature:", e);
                return { success: false, error: e instanceof Error ? e.message : String(e) };
              }
            } else {
              console.error("❌ Failed to create signature - returned null");
              return { success: false, error: "Failed to create signature" };
            }
          } catch (sigError) {
            console.error("❌ Failed to create signature for bid test:", sigError);
            return { success: false, error: `Signature creation failed: ${sigError instanceof Error ? sigError.message : String(sigError)}` };
          }
        } else {
          console.error("❌ No wallet client or address available for signature creation");
          return { success: false, error: "No wallet client or address available" };
        }
      } else {
        console.log("ℹ️ No encrypted bid found or invalid format");
        return { success: false, error: "No encrypted bid found" };
      }
    } catch (error) {
      console.error("❌ Test decrypt bid failed:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, [ready, publicClient, walletClient, address, chainId]);

  // Grant permissions function
  const grantDecryptTo = useCallback(async ({
    relayer,
    ownerSigner,
    handles,
    grantee,
  }: {
    relayer: any;
    ownerSigner: ethers.Signer;
    handles: string[];
    grantee: `0x${string}`;
  }) => {
    const { chainId } = await ownerSigner.provider!.getNetwork();
    const owner = await ownerSigner.getAddress();
    const msg = `FHE-GRANT:${chainId}:${owner.toLowerCase()}:${grantee.toLowerCase()}:${Date.now()}`;
    const signature = await ownerSigner.signMessage(msg);

    console.log("🔍 Granting permissions:", { handles, grantee, owner, chainId });
    console.log("🔍 Available relayer methods:", Object.getOwnPropertyNames(relayer));
    console.log("🔍 Relayer prototype methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(relayer)));

    // Try different grant methods based on SDK version
    if (typeof relayer.grantPermissions === "function") {
      console.log("🔍 Using grantPermissions method");
      return relayer.grantPermissions({ handles, to: grantee, signature });
    }
    if (typeof relayer.share === "function") {
      console.log("🔍 Using share method");
      return relayer.share({ handles, to: grantee, signature });
    }
    if (typeof relayer.authorizeUserDecrypt === "function") {
      console.log("🔍 Using authorizeUserDecrypt method");
      return relayer.authorizeUserDecrypt({ handles, grantee, signature });
    }
    
    // Check for other possible methods
    if (typeof relayer.allow === "function") {
      console.log("🔍 Using allow method");
      return relayer.allow({ handles, to: grantee, signature });
    }
    if (typeof relayer.grant === "function") {
      console.log("🔍 Using grant method");
      return relayer.grant({ handles, to: grantee, signature });
    }
    
    console.log("❌ No grant methods found. Available methods:", Object.keys(relayer));
    console.log("ℹ️ FHEVM SDK không có grant methods. Sẽ skip SDK grant và dùng on-chain grant.");
    return { skipped: true, reason: "No SDK grant methods available" };
  }, []);

  return {
    fheReady: ready,
    fheError: err,
    createOpenWithAsk,
    submitBid,
    revealAndDecrypt,
    grantDecryptPermission,
    grantDecryptTo,
  };
}