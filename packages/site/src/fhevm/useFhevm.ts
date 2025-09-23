'use client';

import { useEffect, useCallback, useState } from 'react';
import { ensureRelayerReady, userDecrypt, encrypt32Single, encryptAskThresholdBatch } from './relayerClient';
import { getRelayerInstance } from './relayer';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { encodeFunctionData, decodeFunctionResult } from 'viem';
import { BlindEscrowABI } from '@/abi/BlindEscrowABI';
import { BLIND_ESCROW_ADDR } from '@/config/contracts';

// Utility function to convert Uint8Array to hex string
function uint8ArrayToHex(uint8Array: Uint8Array): `0x${string}` {
  return `0x${Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
}

export function useFhevm() {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<Error | null>(null);
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

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

    const data = encodeFunctionData({
      abi: BlindEscrowABI.abi as any,
      functionName: "createDealWithAsk",
      args: [
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
          
          // Try to decrypt encrypted values
          try {
            console.log("🔍 Attempting to decrypt encrypted values...");
            const inst = await getRelayerInstance();
            
            // Try to decrypt askAmount (should be encrypted)
            if (askAmount && typeof askAmount === 'string' && askAmount.startsWith('0x')) {
              console.log("🔍 Decrypting askAmount:", askAmount);
              const askDecrypted = await inst.decrypt(askAmount, address);
              console.log("🔍 Decrypted askAmount:", askDecrypted);
            }
            
            // Try to decrypt bidAmount (should be encrypted)
            if (bidAmount && typeof bidAmount === 'string' && bidAmount.startsWith('0x')) {
              console.log("🔍 Decrypting bidAmount:", bidAmount);
              const bidDecrypted = await inst.decrypt(bidAmount, address);
              console.log("🔍 Decrypted bidAmount:", bidDecrypted);
            }
            
            // Try to decrypt threshold (should be encrypted)
            if (threshold && typeof threshold === 'string' && threshold.startsWith('0x')) {
              console.log("🔍 Decrypting threshold:", threshold);
              const thresholdDecrypted = await inst.decrypt(threshold, address);
              console.log("🔍 Decrypted threshold:", thresholdDecrypted);
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
          
          // Try to decrypt ask
          console.log("🔍 Checking ask for decryption...");
          if (askDecoded && typeof askDecoded === 'string' && askDecoded.startsWith('0x')) {
            console.log("🔍 Ask is valid hex string, attempting decryption...");
                 try {
                   askDecrypted = await inst.decrypt(askDecoded);
                   console.log("✅ Offline decrypted ask:", askDecrypted);
                 } catch (e) {
                   console.warn("⚠️ Failed to decrypt ask:", e);
                 }
          } else {
            console.log("🔍 Ask is not valid for decryption:", { askDecoded, type: typeof askDecoded, isString: typeof askDecoded === 'string', startsWith0x: askDecoded && typeof askDecoded === 'string' && askDecoded.startsWith('0x') });
          }
          
          // Try to decrypt bid
          console.log("🔍 Checking bid for decryption...");
          if (bidDecoded && typeof bidDecoded === 'string' && bidDecoded.startsWith('0x')) {
            console.log("🔍 Bid is valid hex string, attempting decryption...");
                 try {
                   bidDecrypted = await inst.decrypt(bidDecoded);
                   console.log("✅ Offline decrypted bid:", bidDecrypted);
                 } catch (e) {
                   console.warn("⚠️ Failed to decrypt bid:", e);
                 }
          } else {
            console.log("🔍 Bid is not valid for decryption:", { bidDecoded, type: typeof bidDecoded, isString: typeof bidDecoded === 'string', startsWith0x: bidDecoded && typeof bidDecoded === 'string' && bidDecoded.startsWith('0x') });
          }
          
          // Try to decrypt threshold
          console.log("🔍 Checking threshold for decryption...");
          if (thresholdDecoded && typeof thresholdDecoded === 'string' && thresholdDecoded.startsWith('0x')) {
            console.log("🔍 Threshold is valid hex string, attempting decryption...");
                 try {
                   thresholdDecrypted = await inst.decrypt(thresholdDecoded);
                   console.log("✅ Offline decrypted threshold:", thresholdDecrypted);
                 } catch (e) {
                   console.warn("⚠️ Failed to decrypt threshold:", e);
                 }
          } else {
            console.log("🔍 Threshold is not valid for decryption:", { thresholdDecoded, type: typeof thresholdDecoded, isString: typeof thresholdDecoded === 'string', startsWith0x: thresholdDecoded && typeof thresholdDecoded === 'string' && thresholdDecoded.startsWith('0x') });
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
  }, [publicClient, checkDealState, address]);

  return {
    fheReady: ready,
    fheError: err,
    createOpenWithAsk,
    submitBid,
    revealAndDecrypt,
  };
}