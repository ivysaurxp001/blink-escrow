'use client';

import { useCallback, useEffect, useState } from 'react';

interface FhevmInstance {
  encrypt32: (n: number) => Promise<string>;
  view: (params: { to: string; data: string }) => Promise<{ result: string }>;
  send: (params: { to: string; data: string }) => Promise<{ hash: string; wait: () => Promise<{ status: number }> }>;
}

export function useFhevm() {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_URL || "http://localhost:3001";
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111");

  const initializeFhevm = useCallback(async () => {
    if (typeof window === 'undefined') {
      setError('FHEVM must run in browser');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Attempting to load @fhevm/sdk...');
      
      // Try to load @fhevm/sdk directly (no relayer server needed)
      const fhevmModule = await import('@fhevm/sdk');
      console.log('📦 FHEVM SDK loaded:', Object.keys(fhevmModule));
      
      const { createInstance } = fhevmModule;
      console.log('🔗 FHEVM SDK loaded', { chainId });
      
      const fhevmInstance = await createInstance({ 
        chainId 
      });
      
      setInstance(fhevmInstance);
      console.log('✅ FHEVM instance created successfully');
    } catch (error) {
      console.error('❌ FHEVM SDK failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      
      // Don't use mock - throw the error
      setError(`FHEVM SDK failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [relayerUrl, chainId]);

  useEffect(() => {
    initializeFhevm();
  }, [initializeFhevm]);

  const encrypt32 = useCallback(async (n: number) => {
    if (!instance) {
      throw new Error('FHEVM instance not initialized');
    }
    
    try {
      const ct = await instance.encrypt32(n);
      console.log('🔐 encrypt32 ok:', n, '->', ct);
      return ct;
    } catch (e: any) {
      console.error('❌ encrypt32 failed:', e?.message || e, e);
      throw e;
    }
  }, [instance]);

  const view = useCallback(async (to: string, data: `0x${string}`) => {
    if (!instance) {
      throw new Error('FHEVM instance not initialized');
    }
    return instance.view({ to, data });
  }, [instance]);
  
  const send = useCallback(async (to: string, data: `0x${string}`) => {
    if (!instance) {
      throw new Error('FHEVM instance not initialized');
    }
    return instance.send({ to, data });
  }, [instance]);

  return {
    instance,
    isLoading,
    error,
    encrypt32,
    view,
    send,
    reinitialize: initializeFhevm
  };
}
