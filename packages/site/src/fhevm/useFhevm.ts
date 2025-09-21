'use client';

import { useState, useEffect, useCallback } from 'react';

// FHEVM hook theo pattern từ FHEVM-confidential-POC
export function useFhevm() {
  const [fhevm, setFhevm] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);

  const initializeFhevm = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if we're in mock mode (default to false to use real FHE)
      const mockMode = process.env.NEXT_PUBLIC_FHE_MOCK === 'true';
      if (mockMode) {
        console.log('🔧 FHEVM Mock Mode enabled');
        setIsMockMode(true);
        setFhevm({
          encrypt32: (n: number) => ({
            data: `0x${n.toString(16).padStart(64, '0')}`,
            nonce: `0x${Math.random().toString(16).substr(2, 64)}`,
            chainId: 11155111,
            timestamp: Date.now()
          }),
          relayerView: async (to: string, data: `0x${string}`) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return { result: "0x" + "0".repeat(64) };
          }
        });
        setIsLoading(false);
        return;
      }

      // Try to load real FHEVM SDK
      console.log('🔍 Loading @zama-fhe/relayer-sdk...');
      let fhevmModule;
      try {
        fhevmModule = await import('@zama-fhe/relayer-sdk/web' as any);
        console.log('📦 FHEVM module loaded:', Object.keys(fhevmModule));
      } catch (importError) {
        console.warn('⚠️ Failed to import @zama-fhe/relayer-sdk/web:', importError);
        throw new Error('Failed to import FHEVM SDK');
      }

      // Initialize SDK first
      if (fhevmModule.initSDK) {
        console.log('🔧 Initializing FHEVM SDK...');
        await fhevmModule.initSDK();
        console.log('✅ FHEVM SDK initialized');
      }

      // Create FHEVM instance
      if (fhevmModule.createInstance) {
        console.log('🔗 Creating FHEVM instance with SepoliaConfig...');
        console.log('📋 SepoliaConfig:', fhevmModule.SepoliaConfig);
        
        try {
          // Use manual config with your RPC URL to avoid rate limits
          console.log('🔗 Using manual config with your RPC...');
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
          
          console.log('🌐 Using RPC:', manualConfig.network);
          const instance = await fhevmModule.createInstance(manualConfig);
          console.log('✅ FHEVM instance created with your RPC');
          console.log('🔍 Instance methods:', Object.getOwnPropertyNames(instance));
          console.log('🔍 Instance prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
          setFhevm(instance);
          setIsMockMode(false);
        } catch (manualError) {
          console.warn('⚠️ Manual config failed, falling back to mock mode:', manualError);
          console.log('🔄 Using mock mode for FHE operations');
          setFhevm(null);
          setIsMockMode(true);
        }
      } else {
        throw new Error('createInstance method not found in FHEVM module');
      }
    } catch (error) {
      console.error('❌ Failed to load FHEVM SDK:', error);
      setError(`Failed to load FHEVM SDK: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fallback to mock mode
      console.log('🔄 Falling back to mock mode');
      setIsMockMode(true);
      setFhevm({
        encrypt32: (n: number) => ({
          data: `0x${n.toString(16).padStart(64, '0')}`,
          nonce: `0x${Math.random().toString(16).substr(2, 64)}`,
          chainId: 11155111,
          timestamp: Date.now()
        }),
        relayerView: async (to: string, data: `0x${string}`) => {
          await new Promise(resolve => setTimeout(resolve, 500));
          return { result: "0x" + "0".repeat(64) };
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      if (isMounted) {
        await initializeFhevm();
      }
    };
    
    init();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to run only once

  const encrypt32 = useCallback(async (n: number) => {
    if (!fhevm) {
      throw new Error('FHEVM not initialized');
    }
    
    console.log('🔐 Encrypting:', n, isMockMode ? '(mock)' : '(real)');
    
    if (isMockMode) {
      // Mock implementation - return bytes32 format
      const bytes32 = `0x${n.toString(16).padStart(64, '0')}`;
      console.log('✅ Encrypted result (mock):', bytes32);
      return bytes32;
    }
    
    try {
      // Real FHEVM implementation
      if (fhevm.createEncryptedInput && fhevm.createEncryptedInput().add32 && fhevm.createEncryptedInput().add32().encrypt) {
        const encryptedInput = fhevm.createEncryptedInput('0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000');
        const result = await encryptedInput.add32(n).encrypt();
        console.log('✅ Encrypted result (real):', result);
        
        // Convert to expected format for contract
        if (result && result.handles && result.handles.length > 0) {
          // Use the first handle as bytes32
          const handle = result.handles[0];
          const bytes32 = `0x${Array.from(handle).map((b: any) => b.toString(16).padStart(2, '0')).join('').padStart(64, '0')}`;
          return bytes32;
        } else {
          throw new Error('Invalid encryption result format');
        }
      } else {
        throw new Error('FHEVM instance does not have expected encryption methods');
      }
    } catch (error) {
      console.warn('⚠️ Real encryption failed, falling back to mock:', error);
      // Fallback to mock - return bytes32 format
      const bytes32 = `0x${n.toString(16).padStart(64, '0')}`;
      console.log('✅ Encrypted result (fallback):', bytes32);
      return bytes32;
    }
  }, [fhevm, isMockMode]);

  const relayerView = useCallback(async (to: string, data: `0x${string}`) => {
    if (!fhevm) {
      throw new Error('FHEVM not initialized');
    }
    
    console.log('👁️ Relayer view:', { to, data }, isMockMode ? '(mock)' : '(real)');
    
    if (isMockMode) {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = { result: "0x" + "0".repeat(64) };
      console.log('✅ Relayer result (mock):', result);
      return result;
    }
    
    try {
      // Real FHEVM implementation - check if method exists
      if (fhevm.relayerView) {
        const result = await fhevm.relayerView(to, data);
        console.log('✅ Relayer result (real):', result);
        return result;
      } else {
        throw new Error('FHEVM instance does not have relayerView method');
      }
    } catch (error) {
      console.warn('⚠️ Real relayer view failed, falling back to mock:', error);
      // Fallback to mock
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = { result: "0x" + "0".repeat(64) };
      console.log('✅ Relayer result (fallback):', result);
      return result;
    }
  }, [fhevm, isMockMode]);

  return {
    fhevm,
    isLoading,
    error,
    isMockMode,
    encrypt32,
    relayerView,
    reinitialize: initializeFhevm
  };
}