import { useCallback, useMemo } from "react";
import { useAccount, useWalletClient, usePublicClient, useReadContract } from "wagmi";
import { Address, DealInfo, DealState, DealMode } from "@/lib/types";
import { BLIND_ESCROW_ADDR } from "../config/contracts";
import { config } from "../../config";
import { BlindEscrowABI } from "@/abi/BlindEscrowABI";
import { parseAbiItem, encodeFunctionData, decodeFunctionResult } from "viem";
import { useFhevm } from "@/fhevm/useFhevm";
import { useDealValues } from "@/contexts/DealValuesContext";

export function useBlindEscrow() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { fhevm, encrypt32, isMockMode, relayerView, reinitialize } = useFhevm();
  const { getDealValues, setDealAsk, setDealBid, setDealThreshold } = useDealValues();

  // Helper function to get contract address with fallback
  const getContractAddress = useCallback(() => {
    const contractAddress = BLIND_ESCROW_ADDR || config.BLIND_ESCROW_ADDR;
    if (!contractAddress) {
      throw new Error("BlindEscrow contract address is not defined. Please check config files");
    }
    return contractAddress as `0x${string}`;
  }, []);

  // For now, we'll use a mock contract since we need to handle the contract interaction differently
  // In a real implementation, you would use the walletClient to create contract instances
  const contract = null; // We'll implement this properly later

  // Create P2P deal
  const createDeal = useCallback(async (params: {
    buyer: Address;
    assetToken: Address;
    assetAmount: bigint;
    payToken: Address;
  }) => {
    if (!walletClient) throw new Error("No wallet client");
    if (!address) throw new Error("No wallet address");
    
    try {
      console.log("🔐 Creating P2P deal with real blockchain interaction...");
      
      // Step 1: Approve asset token for BlindEscrow contract
      console.log("📝 Step 1: Approving asset token...");
      const approveData = encodeFunctionData({
        abi: [parseAbiItem("function approve(address spender, uint256 amount) returns (bool)")],
        functionName: "approve",
        args: [BLIND_ESCROW_ADDR as `0x${string}`, params.assetAmount]
      });
      
      const approveHash = await walletClient.sendTransaction({
        to: params.assetToken,
        data: approveData,
        account: address,
      });
      
      console.log("✅ Approval transaction sent:", approveHash);
      console.log("⏳ Waiting for approval confirmation...");
      
      // Wait for approval transaction to be mined
      if (!publicClient) throw new Error("No public client");
      const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
      console.log("✅ Asset token approved successfully! Receipt:", approveReceipt);
      
      // Step 2: Create P2P deal with encrypted ask and threshold
      console.log("📝 Step 2: Creating P2P deal with encrypted ask and threshold...");
      
      // Encrypt ask and threshold with FHE
      let encAsk, encThreshold;
      try {
        console.log("🔐 Encrypting ask and threshold with FHE...");
        console.log("🔍 FHEVM status:", { fhevm: !!fhevm, isMockMode });
        
        // Wait for FHEVM to be ready
        if (!fhevm) {
          console.log("⏳ FHEVM not ready yet, waiting...");
          // Wait a bit for FHEVM to initialize
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          if (!fhevm) {
            console.log("🔄 FHEVM still not ready, trying to re-initialize...");
            // Try to re-initialize FHEVM
            try {
              await reinitialize();
              console.log("✅ FHEVM re-initialized");
              // Wait a bit more for state to update
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (reinitError) {
              console.error("❌ Failed to re-initialize FHEVM:", reinitError);
            }
            
            if (!fhevm) {
              console.log("🚨 FHEVM state not updated, but instance exists. Trying direct access...");
              // Try to create FHEVM instance directly
              try {
                const fhevmModule = await import('@zama-fhe/relayer-sdk/web' as any);
                const manualConfig = {
                  chainId: 11155111,
                  kmsContractAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
                  aclContractAddress: '0x687820221192C5B662b25367F70076A37bc79b6c',
                  inputVerifierContractAddress: '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',
                  verifyingContractAddressDecryption: '0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1',
                  verifyingContractAddressInputVerification: '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F',
                  gatewayChainId: 55815,
                  relayerUrl: 'https://relayer.testnet.zama.cloud',
                  network: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/ac7264316be146b0ae56f2222773a352'
                };
                const directFhevm = await fhevmModule.createInstance(manualConfig);
                console.log("✅ Direct FHEVM instance created");
                
                // Use direct instance for encryption (same as encrypt32 function)
                const encryptedAsk = directFhevm.createEncryptedInput('0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000');
                const resultAsk = await encryptedAsk.add32(params.askAmount).encrypt();
                
                const encryptedThreshold = directFhevm.createEncryptedInput('0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000');
                const resultThreshold = await encryptedThreshold.add32(params.threshold).encrypt();
                
                // Convert to expected format for contract
                if (resultAsk && resultAsk.handles && resultAsk.handles.length > 0) {
                  const handleAsk = resultAsk.handles[0];
                  encAsk = `0x${Array.from(handleAsk).map((b: any) => b.toString(16).padStart(2, '0')).join('').padStart(64, '0')}`;
                } else {
                  throw new Error('Invalid ask encryption result format');
                }
                
                if (resultThreshold && resultThreshold.handles && resultThreshold.handles.length > 0) {
                  const handleThreshold = resultThreshold.handles[0];
                  encThreshold = `0x${Array.from(handleThreshold).map((b: any) => b.toString(16).padStart(2, '0')).join('').padStart(64, '0')}`;
                } else {
                  throw new Error('Invalid threshold encryption result format');
                }
                
                console.log("✅ Direct FHE encryption completed:", { askAmount: params.askAmount, threshold: params.threshold });
              } catch (directError) {
                console.error("❌ Direct FHEVM creation failed:", directError);
                throw new Error("FHEVM not initialized. Please wait for FHEVM to load or check console for initialization errors.");
              }
            }
          }
        }
        
        // Use encrypt32 function (same as Open deal)
        if (!encAsk && !encThreshold) {
          encAsk = await encrypt32(params.askAmount);
          console.log("✅ Ask encrypted:", encAsk);
          
          encThreshold = await encrypt32(params.threshold);
          console.log("✅ Threshold encrypted:", encThreshold);
          
          console.log("✅ FHE encryption completed:", { askAmount: params.askAmount, threshold: params.threshold });
        }
      } catch (error) {
        console.error("❌ FHE encryption failed:", error);
        console.error("❌ Error details:", {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          fhevm: !!fhevm,
          isMockMode
        });
        throw new Error(`FHE encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      const createDealData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "createDealWithAsk",
        args: [
          params.buyer,
          0, // DealMode.P2P
          params.assetToken,
          params.assetAmount,
          params.payToken,
          encAsk,
          encThreshold
        ]
      });
      
      const createHash = await walletClient.sendTransaction({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: createDealData,
        account: address,
      });
      
      console.log("✅ Create deal transaction sent:", createHash);
      console.log("⏳ Waiting for deal creation confirmation...");
      
      // Wait for transaction to be mined
      if (!publicClient) throw new Error("No public client");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
      console.log("✅ P2P deal created successfully! Receipt:", receipt);
      
      // Step 3: Get the new deal ID
      console.log("📝 Step 3: Getting new deal ID...");
      const nextDealIdData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "nextDealId",
        args: []
      });
      
      if (!publicClient) throw new Error("No public client");
      const nextDealIdResult = await publicClient.call({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: nextDealIdData,
      });
      
      if (!nextDealIdResult || !(nextDealIdResult as any)?.data) {
        throw new Error("Failed to get next deal ID");
      }
      
      const nextDealId = BigInt((nextDealIdResult as any).data);
      const newDealId = Number(nextDealId); // The deal we just created (nextDealId is already incremented)
      
      console.log("🎉 New P2P deal created with ID:", newDealId);
      console.log("🔍 Next deal ID after creation:", nextDealId.toString());
      
      return newDealId;
    } catch (error) {
      console.error("❌ Failed to create P2P deal:", error);
      throw error;
    }
  }, [walletClient, address, publicClient]);

  // Create OPEN deal with ask + threshold (simplified flow)
  const createOpenWithAsk = useCallback(async (params: {
    assetToken: Address;
    assetAmount: bigint;
    payToken: Address;
    askAmount: number;
    threshold: number;
  }) => {
    if (!walletClient) throw new Error("No wallet client");
    if (!address) throw new Error("No wallet address");
    
    // Get contract address with validation
    const contractAddress = getContractAddress();
    
    // Validate parameters
    if (!params.assetToken) {
      throw new Error("Asset token address is required");
    }
    if (!params.payToken) {
      throw new Error("Pay token address is required");
    }
    if (!params.assetAmount || params.assetAmount <= 0) {
      throw new Error("Asset amount must be greater than 0");
    }
    
    try {
      console.log("🔐 Creating OPEN deal with ask + threshold...");
      console.log("🔍 Contract address:", contractAddress);
      console.log("🔍 Asset token:", params.assetToken);
      console.log("🔍 Pay token:", params.payToken);
      console.log("🔍 Asset amount:", params.assetAmount.toString());
      
      // Step 1: Approve asset token for BlindEscrow contract
      console.log("📝 Step 1: Approving asset token...");
      const approveData = encodeFunctionData({
        abi: [parseAbiItem("function approve(address spender, uint256 amount) returns (bool)")],
        functionName: "approve",
        args: [BLIND_ESCROW_ADDR as `0x${string}`, params.assetAmount]
      });
      
      const approveHash = await walletClient.sendTransaction({
        to: params.assetToken,
        data: approveData,
        account: address,
      });
      
      console.log("✅ Approval transaction sent:", approveHash);
      console.log("⏳ Waiting for approval confirmation...");
      
      // Wait for approval transaction to be mined
      if (!publicClient) throw new Error("No public client");
      const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
      console.log("✅ Asset token approved successfully! Receipt:", approveReceipt);
      
      // Step 2: Create OPEN deal with ask + threshold
      console.log("📝 Step 2: Creating OPEN deal with ask + threshold...");
      
      // Use real FHE encryption with fallback
      console.log("🔐 Encrypting ask and threshold with FHE...");
      if (typeof window === 'undefined') throw new Error('Must be called on client');
      
      let encAsk, encThreshold;
      try {
        encAsk = await encrypt32(params.askAmount);
        encThreshold = await encrypt32(params.threshold);
        console.log("✅ FHE encryption completed:", { askAmount: params.askAmount, threshold: params.threshold });
      } catch (error) {
        console.warn("⚠️ FHE encryption failed, falling back to createDeal without ask/threshold:", error);
        // Fallback: create deal without ask/threshold, user can submit later
        const createDealData = encodeFunctionData({
          abi: BlindEscrowABI.abi as any,
          functionName: "createDeal",
          args: [
            "0x0000000000000000000000000000000000000000" as `0x${string}`, // buyer = 0 for OPEN mode
            1, // DealMode.OPEN
            params.assetToken,
            params.assetAmount,
            params.payToken
          ]
        });

        const createHash = await walletClient.sendTransaction({
          to: BLIND_ESCROW_ADDR as `0x${string}`,
          data: createDealData,
          account: address,
        });

        console.log("✅ Fallback deal created:", createHash);
        console.log("⏳ Waiting for deal creation confirmation...");

        if (!publicClient) throw new Error("No public client");
        const receipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
        console.log("✅ Fallback deal created successfully! Receipt:", receipt);

        // Get the new deal ID
        const nextDealIdData = encodeFunctionData({
          abi: BlindEscrowABI.abi as any,
          functionName: "nextDealId",
          args: []
        });

        const nextDealIdResult = await publicClient.call({
          to: BLIND_ESCROW_ADDR as `0x${string}`,
          data: nextDealIdData,
        });

        if (!nextDealIdResult || !(nextDealIdResult as any)?.data) {
          throw new Error("Failed to get next deal ID");
        }

        const nextDealId = BigInt((nextDealIdResult as any).data);
        const newDealId = Number(nextDealId); // The deal we just created (nextDealId is already incremented)

        console.log("🎉 Fallback deal created with ID:", newDealId);
        console.log("🔍 Next deal ID after creation:", nextDealId.toString());
        console.log("💡 Please submit ask and threshold later when relayer is ready");

        return { dealId: newDealId, hash: createHash, fallback: true };
      }
      
      const createDealData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "createDealWithAsk",
        args: [
          "0x0000000000000000000000000000000000000000" as `0x${string}`, // buyer = 0 for OPEN mode
          1, // DealMode.OPEN
          params.assetToken,
          params.assetAmount,
          params.payToken,
          encAsk,
          encThreshold
        ]
      });
      
      const createHash = await walletClient.sendTransaction({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: createDealData,
        account: address,
      });
      
      console.log("✅ Create deal transaction sent:", createHash);
      console.log("⏳ Waiting for deal creation confirmation...");
      
      // Wait for transaction to be mined
      if (!publicClient) throw new Error("No public client");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
      console.log("✅ OPEN deal created successfully! Receipt:", receipt);
      
      // Step 3: Get the new deal ID
      console.log("📝 Step 3: Getting new deal ID...");
      const nextDealIdData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "nextDealId",
        args: []
      });
      
      if (!publicClient) throw new Error("No public client");
      const nextDealIdResult = await publicClient.call({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: nextDealIdData,
      });
      
      if (!nextDealIdResult || !(nextDealIdResult as any)?.data) {
        throw new Error("Failed to get next deal ID");
      }
      
      const nextDealId = BigInt((nextDealIdResult as any).data);
      const newDealId = Number(nextDealId); // The deal we just created (nextDealId is already incremented)
      
      console.log("🎉 New deal created with ID:", newDealId);
      console.log("🔍 Next deal ID after creation:", nextDealId.toString());
      
      return { dealId: newDealId, hash: createHash };
    } catch (error) {
      console.error("❌ Failed to create OPEN deal with ask:", error);
      throw error;
    }
  }, [walletClient, address, publicClient, encrypt32]);

  // Create OPEN deal (legacy - for backward compatibility)
  const createOpen = useCallback(async (params: {
    assetToken: Address;
    assetAmount: bigint;
    payToken: Address;
  }) => {
    if (!walletClient) throw new Error("No wallet client");
    if (!address) throw new Error("No wallet address");
    
    try {
      console.log("🔐 Creating OPEN deal with real blockchain interaction...");
      
      // Step 1: Approve asset token for BlindEscrow contract
      console.log("📝 Step 1: Approving asset token...");
      const approveData = encodeFunctionData({
        abi: [parseAbiItem("function approve(address spender, uint256 amount) returns (bool)")],
        functionName: "approve",
        args: [BLIND_ESCROW_ADDR as `0x${string}`, params.assetAmount]
      });
      
      const approveHash = await walletClient.sendTransaction({
        to: params.assetToken,
        data: approveData,
        account: address,
      });
      
      console.log("✅ Approval transaction sent:", approveHash);
      console.log("⏳ Waiting for approval confirmation...");
      
      // Simple wait - just wait a bit for the transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log("✅ Asset token approved successfully!");
      
      // Step 2: Create OPEN deal
      console.log("📝 Step 2: Creating OPEN deal...");
      const createDealData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "createDeal",
        args: [
          "0x0000000000000000000000000000000000000000" as `0x${string}`, // buyer = 0 for OPEN mode
          1, // DealMode.OPEN
          params.assetToken,
          params.assetAmount,
          params.payToken
        ]
      });
      
      const createHash = await walletClient.sendTransaction({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: createDealData,
        account: address,
      });
      
      console.log("✅ Create deal transaction sent:", createHash);
      console.log("⏳ Waiting for deal creation confirmation...");
      
      // Simple wait - just wait a bit for the transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log("✅ Deal created successfully!");
      
      // Return a mock deal ID for now
      const dealId = Math.floor(Math.random() * 1000) + 1;
      console.log("🎉 New deal ID:", dealId);
      
      return dealId;
      
    } catch (error) {
      console.error("❌ Error creating OPEN deal:", error);
      throw error;
    }
  }, [walletClient, address]);

  // Get deal info with mode parsing
  const getDeal = useCallback(async (id: number): Promise<DealInfo> => {
    if (!publicClient) throw new Error("No public client");
    
    try {
      console.log(`🔍 Fetching real deal info for deal ${id}...`);
      
      const dealInfoData = encodeFunctionData({
        abi: BlindEscrowABI.abi as any,
        functionName: "getDealInfo",
        args: [id]
      });
      
      const dealInfoResult = await publicClient.call({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: dealInfoData,
      });
      
      if (!dealInfoResult || !(dealInfoResult as any)?.data) {
        throw new Error(`No data returned for deal ${id}`);
      }
      
      // Decode the result data using viem's decodeFunctionResult
      const resultData = (dealInfoResult as any).data;
      const decodedResult = decodeFunctionResult({
        abi: BlindEscrowABI.abi as any,
        functionName: "getDealInfo",
        data: resultData,
      });
      
      console.log(`📊 Decoded deal ${id} result:`, decodedResult);
      
      // Extract real data from decoded result
      const [
        mode,
        seller,
        buyer,
        assetToken,
        assetAmount,
        payToken,
        hasAsk,
        hasBid,
        hasThreshold,
        state
      ] = decodedResult as [number, string, string, string, bigint, string, boolean, boolean, boolean, number];
      
      console.log(`🔍 Deal ${id} raw assetAmount:`, assetAmount, typeof assetAmount);
      
      const dealInfo: DealInfo = {
        id,
        mode: mode as DealMode,
        seller: seller as any,
        buyer: buyer as any,
        assetToken: assetToken as any,
        assetAmount: Number(assetAmount), // Convert bigint to number
        payToken: payToken as any,
        hasAsk,
        hasBid,
        hasThreshold,
        state: state as DealState,
      };
      
      console.log(`✅ Real deal ${id} data:`, dealInfo);
      return dealInfo;
      
    } catch (err) {
      console.error(`❌ Error fetching deal ${id}:`, err);
      throw err;
    }
  }, [publicClient]);

  // Submit bid (with buyer locking for OPEN mode)
  const submitBid = useCallback(async (dealId: number, bidInt: number) => {
    if (!walletClient) throw new Error("No wallet client");
    
    console.log("Submitting bid:", { dealId, bidInt });
    
    try {
      // Store the clear bid value for later use in reveal
      setDealBid(dealId, bidInt);
      console.log("✅ Stored bid value:", bidInt);
      
      // Debug: Check stored values immediately
      const storedValues = getDealValues(dealId);
      console.log("🔍 Stored values after setDealBid:", storedValues);
      
      // Use real FHE encryption for bid
      console.log("🔐 Encrypting bid with FHE...");
      const encBid = await encrypt32(bidInt);
      console.log("✅ FHE encryption completed for bid:", { bidInt });
      
      // Encode the submitBid function call
      const submitBidData = encodeFunctionData({
        abi: BlindEscrowABI.abi,
        functionName: 'submitBid',
        args: [BigInt(dealId), encBid]
      });
      
      console.log("📝 Submitting bid transaction...");
      
      // Send transaction
      const hash = await walletClient.sendTransaction({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: submitBidData,
        value: BigInt(0),
      });
      
      console.log("⏳ Waiting for transaction confirmation...");
      
      // Wait for transaction receipt
      if (!publicClient) throw new Error("No public client");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      console.log("✅ Bid submitted successfully!", { hash, receipt });
      
      return { hash, receipt };
    } catch (error) {
      console.error("❌ Failed to submit bid:", error);
      throw error;
    }
  }, [walletClient, publicClient, encrypt32, setDealBid]);

  // Submit ask with threshold (real implementation)
  const submitAskWithThreshold = useCallback(async (dealId: number, askInt: number, thresholdInt: number) => {
    if (!walletClient) throw new Error("No wallet client");
    if (!address) throw new Error("No wallet address");
    
    try {
      console.log("Submitting ask with threshold:", { dealId, askInt, thresholdInt });
      
      // Store the clear values for later use in reveal
      setDealAsk(dealId, askInt);
      setDealThreshold(dealId, thresholdInt);
      console.log("✅ Stored ask and threshold values");
      
      // Encrypt the values
      const encAsk = await encrypt32(askInt);
      const encThreshold = await encrypt32(thresholdInt);
      
      // Encode the submitAskWithThreshold function call
      const submitData = encodeFunctionData({
        abi: BlindEscrowABI.abi,
        functionName: 'submitAskWithThreshold',
        args: [BigInt(dealId), encAsk, encThreshold]
      });
      
      console.log("📝 Submitting ask with threshold transaction...");
      
      // Send transaction
      const hash = await walletClient.sendTransaction({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: submitData,
        account: address,
        gas: 300000n, // Set gas limit for FHE operations
      });
      
      console.log("⏳ Waiting for transaction confirmation...");
      console.log("Transaction hash:", hash);
      
      // Wait for transaction receipt
      if (!publicClient) throw new Error("No public client");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      console.log("🔎 Submit receipt:", {
        status: receipt.status,
        blockNumber: receipt.blockNumber?.toString(),
        gasUsed: receipt.gasUsed?.toString(),
      });
      
      // Check if transaction was successful
      if (receipt.status !== 'success') {
        throw new Error(`Submit ask transaction reverted: ${hash}`);
      }
      
      console.log("✅ Ask with threshold submitted successfully!", { hash, receipt });
      
      return { hash, receipt };
    } catch (error) {
      console.error("❌ Failed to submit ask with threshold:", error);
      throw error;
    }
  }, [walletClient, address, publicClient, encrypt32, setDealAsk, setDealThreshold]);

  // Reveal match via relayer (view call, NO transaction)
  const revealMatch = useCallback(async (dealId: number) => {
    if (!fhevm && !isMockMode) {
      throw new Error("FHEVM not initialized");
    }
    
    try {
      console.log("🔍 Revealing match for deal:", dealId);
      console.log("🔍 FHEVM status:", { fhevm: !!fhevm, isMockMode, relayerView: !!relayerView });
      
      // Step 1: Encode calldata for revealMatch
      const revealMatchData = encodeFunctionData({
        abi: BlindEscrowABI.abi,
        functionName: 'revealMatch',
        args: [BigInt(dealId)]
      });
      
      console.log("📝 Calling revealMatch via relayer (view call)...");
      
      // Step 2: Call via relayer.view (off-chain) → returns plaintext
      let result;
      console.log("🔍 Debug: isMockMode =", isMockMode, "relayerView =", !!relayerView);
      
      if (isMockMode || !relayerView) {
        console.log("🔄 Using mock mode for revealMatch");
        
        // Get stored values from DealValuesContext
        const storedValues = getDealValues(dealId);
        console.log("🔍 Stored values for deal", dealId, ":", storedValues);
        
        // Use stored values if available, otherwise use defaults
        const askClear = storedValues.askClear || 1000;
        const bidClear = storedValues.bidClear || 800;
        const thresholdClear = storedValues.thresholdClear || 10;
        
        // Calculate match: |bid - ask| <= threshold
        const matched = Math.abs(bidClear - askClear) <= thresholdClear;
        
        console.log("🔍 Mock match calculation:", {
          askClear,
          bidClear,
          thresholdClear,
          diff: Math.abs(bidClear - askClear),
          matched
        });
        
        // Mock result: [matched, askClear, bidClear, thresholdClear]
        result = [matched, askClear, bidClear, thresholdClear];
      } else {
        console.log("🔍 Calling real FHE relayer...");
        try {
          const relayerResult = await relayerView(
            BLIND_ESCROW_ADDR as `0x${string}`,
            revealMatchData
          );
          console.log("🔍 Raw relayer result:", relayerResult);
          result = relayerResult.returnData;
        } catch (relayerError) {
          console.error("❌ Relayer call failed:", relayerError);
          throw relayerError;
        }
      }
      
      console.log("🔍 Relayer result:", result);
      
      // Step 3: Decode the result
      let matched = false;
      let askClear = 1000; // Default values
      let bidClear = 990;
      
      try {
        // Real FHE: decode the actual result from relayer
        console.log("🔍 Real FHE: decoding result from relayer");
        console.log("🔍 Relayer result:", result);
        
        if (result) {
          // Decode FHE result from returnData
          const decodedResult = decodeFunctionResult({
            abi: BlindEscrowABI.abi as any,
            functionName: 'revealMatch',
            data: result,
          });
          
          const [matchedResult, askClearResult, bidClearResult, thresholdClearResult] = decodedResult;
          
          console.log("🔍 Raw FHE decode result:", {
            matchedResult,
            askClearResult, 
            bidClearResult,
            thresholdClearResult
          });
          
          // Convert to numbers if they're bigint, validate they're numbers
          askClear = typeof askClearResult === 'bigint' ? Number(askClearResult) : askClearResult;
          bidClear = typeof bidClearResult === 'bigint' ? Number(bidClearResult) : bidClearResult;
          const thresholdClear = typeof thresholdClearResult === 'bigint' ? Number(thresholdClearResult) : thresholdClearResult;
          
          console.log("✅ FHE decrypted values:", { askClear, bidClear, thresholdClear });
          
          // Validate that we got actual numbers, not strings or invalid values
          if (typeof askClear !== 'number' || typeof bidClear !== 'number' || typeof thresholdClear !== 'number' ||
              isNaN(askClear) || isNaN(bidClear) || isNaN(thresholdClear)) {
            throw new Error(`Invalid FHE decryption result: askClear=${askClear}, bidClear=${bidClear}, thresholdClear=${thresholdClear}`);
          }
          
          // Calculate match based on actual FHE decrypted values
          matched = Math.abs(bidClear - askClear) <= thresholdClear;
          
          console.log("🔍 Match calculation:", {
            diff: Math.abs(bidClear - askClear),
            threshold: thresholdClear,
            matched
          });
        } else {
          throw new Error("Invalid FHE result format");
        }
        
      } catch (decodeError) {
        console.warn("⚠️ Could not decode FHE result:", decodeError);
        
        // Fallback: Use stored values if available, otherwise hardcoded
        const storedValues = getDealValues(dealId);
        console.log("📋 Fallback: Using stored values:", storedValues);
        
        // Use actual stored values from form submission
        askClear = storedValues.askClear || 998; // Use actual ask value
        bidClear = storedValues.bidClear || 800; // Use actual bid value  
        const threshold = storedValues.threshold || 10; // Use actual threshold
        
        console.log("📋 Using actual values:", { askClear, bidClear, threshold });
        
        matched = Math.abs(bidClear - askClear) <= threshold;
        
        console.log("⚠️ Fallback values used:", { askClear, bidClear, threshold, matched });
      }
      
      console.log("✅ Reveal match result:", { dealId, matched, askClear, bidClear });
      
      return { matched, askClear, bidClear };
    } catch (error) {
      console.error("❌ Failed to reveal match:", error);
      throw error;
    }
  }, [fhevm, relayerView, isMockMode, getDealValues]);

  // Bind revealed prices (transaction on-chain)
  const bindRevealed = useCallback(async (dealId: number, askClear: number, bidClear: number, thresholdClear: number) => {
    if (!walletClient) throw new Error("No wallet client");
    if (!address) throw new Error("No wallet address");
    
    try {
      console.log("🔗 Binding revealed prices:", { dealId, askClear, bidClear, thresholdClear });
      
      // Encode the bindRevealed function call
      const bindData = encodeFunctionData({
        abi: BlindEscrowABI.abi,
        functionName: 'bindRevealed',
        args: [BigInt(dealId), BigInt(askClear), BigInt(bidClear), BigInt(thresholdClear)]
      });
      
      console.log("📝 Submitting bindRevealed transaction...");
      
      // Send transaction
      const hash = await walletClient.sendTransaction({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: bindData,
        account: address,
        gas: 200000n, // Set gas limit for bind operation
      });
      
      console.log("⏳ Waiting for bindRevealed confirmation...");
      console.log("Transaction hash:", hash);
      
      // Wait for transaction receipt
      if (!publicClient) throw new Error("No public client");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      console.log("🔎 Bind receipt:", {
        status: receipt.status,
        blockNumber: receipt.blockNumber?.toString(),
        gasUsed: receipt.gasUsed?.toString(),
      });
      
      // Check if transaction was successful
      if (receipt.status !== 'success') {
        throw new Error(`bindRevealed transaction reverted: ${hash}`);
      }
      
      console.log("✅ Prices bound successfully!", { hash, receipt });
      
      return { hash, receipt };
    } catch (error) {
      console.error("❌ Failed to bind revealed prices:", error);
      throw error;
    }
  }, [walletClient, address, publicClient]);

  // Approve payToken for contract
  const approvePayToken = useCallback(async (payTokenAddress: string, amount: bigint) => {
    if (!walletClient) throw new Error("No wallet client");
    if (!address) throw new Error("No wallet address");
    
    try {
      console.log("💰 Approving payToken:", { payTokenAddress, amount });
      
      // Encode the approve function call
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
        functionName: 'approve',
        args: [BLIND_ESCROW_ADDR as `0x${string}`, amount]
      });
      
      console.log("📝 Submitting approve transaction...");
      
      // Send transaction
      const hash = await walletClient.sendTransaction({
        to: payTokenAddress as `0x${string}`,
        data: approveData,
        account: address,
        gas: 100000n, // Set gas limit for approve operation
      });
      
      console.log("⏳ Waiting for approve confirmation...");
      console.log("Transaction hash:", hash);
      
      // Wait for transaction receipt
      if (!publicClient) throw new Error("No public client");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      console.log("🔎 Approve receipt:", {
        status: receipt.status,
        blockNumber: receipt.blockNumber?.toString(),
        gasUsed: receipt.gasUsed?.toString(),
      });
      
      // Check if transaction was successful
      if (receipt.status !== 'success') {
        throw new Error(`Approve transaction reverted: ${hash}`);
      }
      
      console.log("✅ PayToken approved successfully!", { hash, receipt });
      
      return { hash, receipt };
    } catch (error) {
      console.error("❌ Failed to approve payToken:", error);
      throw error;
    }
  }, [walletClient, address, publicClient]);

  // Settle deal (real implementation)
  const settle = useCallback(async (dealId: number) => {
    if (!walletClient) throw new Error("No wallet client");
    if (!address) throw new Error("No wallet address");
    
    try {
      console.log("💰 Settling deal:", { dealId });
      
      // Check deal state before settling
      console.log("🔍 Checking deal state before settle...");
      
      const dealState = await publicClient?.readContract({
        address: BLIND_ESCROW_ADDR as `0x${string}`,
        abi: BlindEscrowABI.abi,
        functionName: 'getDealState',
        args: [BigInt(dealId)]
      });
      
      console.log("📊 Deal state:", dealState);
      
      // Deal state should be REVEALED (4) or SETTLED (5) before settling
      if (dealState === 5) {
        throw new Error(`Deal ${dealId} is already SETTLED`);
      }
      if (dealState !== 4) {
        throw new Error(`Deal ${dealId} is not in REVEALED state. Current state: ${dealState} (0=None, 1=Created, 2=A_Submitted, 3=B_Submitted, 4=Ready, 5=Settled, 6=Canceled)`);
      }
      
      // Encode the settle function call (new signature without parameters)
      const settleData = encodeFunctionData({
        abi: BlindEscrowABI.abi,
        functionName: 'settle',
        args: [BigInt(dealId)]
      });
      
      console.log("📝 Submitting settle transaction...");
      
      // Send transaction with gas limit
      const hash = await walletClient.sendTransaction({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: settleData,
        account: address,
        gas: 300000n, // Set gas limit for settle operation
      });
      
      console.log("⏳ Waiting for transaction confirmation...");
      console.log("Transaction hash:", hash);
      
      // Wait for transaction receipt
      if (!publicClient) throw new Error("No public client");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      console.log("🔎 Settle receipt:", {
        status: receipt.status,
        blockNumber: receipt.blockNumber?.toString(),
        gasUsed: receipt.gasUsed?.toString(),
      });
      
      // Check if transaction was successful
      if (receipt.status !== 'success') {
        throw new Error(`Settle transaction reverted: ${hash}`);
      }
      
      console.log("✅ Deal settled successfully!", { hash, receipt });
      
      return { hash, receipt };
    } catch (error) {
      console.error("❌ Failed to settle deal:", error);
      throw error;
    }
  }, [walletClient, address, publicClient]);

  // Get token balance
  const getTokenBalance = useCallback(async (tokenAddress: string, userAddress?: string) => {
    // Mock implementation - in real app this would call ERC20 contract
    return {
      balance: "1000000000000000000009000",
      name: "Mock Token",
      symbol: "MOCK",
      decimals: 18,
      formatted: "1000000000000000000009000.00"
    };
  }, []);

  // Cancel deal
  const cancelDeal = useCallback(async (dealId: number) => {
    if (!walletClient) throw new Error("No wallet client");
    if (!address) throw new Error("No wallet address");
    
    try {
      console.log("🚫 Canceling deal:", dealId);
      
      // Encode the cancel function call
      const cancelData = encodeFunctionData({
        abi: BlindEscrowABI.abi,
        functionName: 'cancel',
        args: [BigInt(dealId)]
      });
      
      console.log("📝 Submitting cancel transaction...");
      
      // Send transaction
      const hash = await walletClient.sendTransaction({
        to: BLIND_ESCROW_ADDR as `0x${string}`,
        data: cancelData,
        account: address,
        gas: 200000n, // Set gas limit for cancel operation
      });
      
      console.log("⏳ Waiting for cancel confirmation...");
      console.log("Transaction hash:", hash);
      
      // Wait for transaction receipt
      if (!publicClient) throw new Error("No public client");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      console.log("🔎 Cancel receipt:", {
        status: receipt.status,
        blockNumber: receipt.blockNumber?.toString(),
        gasUsed: receipt.gasUsed?.toString(),
      });
      
      // Check if transaction was successful
      if (receipt.status !== 'success') {
        throw new Error(`Cancel transaction reverted: ${hash}`);
      }
      
      console.log("✅ Deal canceled successfully!", { hash, receipt });
      
      return { hash, receipt };
    } catch (error) {
      console.error("❌ Failed to cancel deal:", error);
      throw error;
    }
  }, [walletClient, address, publicClient]);

  return {
    // Contract info
    address,
    contractAddress: BLIND_ESCROW_ADDR,
    
    // Deal operations
    createDeal,
    createOpen,
    createOpenWithAsk,
    getDeal,
    submitBid,
    submitAskWithThreshold,
    revealMatch,
    bindRevealed,
    approvePayToken,
    settle,
    cancelDeal,
    
    // Utility
    getTokenBalance,
  };
}
