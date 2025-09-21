'use client';

import { useCallback } from 'react';

export function useRelayer() {
  const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_URL || "http://localhost:3001";
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111");

  const get = useCallback(async () => {
    if (typeof window === 'undefined') {
      throw new Error('FHEVM must run in browser');
    }
    
    try {
      // Import @zama-fhe/relayer-sdk dynamically
      const { createInstance } = await import('@zama-fhe/relayer-sdk');
      console.log('🔗 FHEVM SDK loaded', { relayerUrl, chainId });
      
      const instance = await createInstance({ 
        relayerUrl, 
        chainId 
      });
      
      return instance;
    } catch (error) {
      console.error('❌ FHEVM SDK failed:', error);
      console.warn('⚠️ Using mock FHE implementation for development');
      
      // Mock implementation for development
      return {
        encrypt32: async (n: number) => {
          console.log('🔐 Mock encrypt32:', n);
          // Return a mock encrypted value (just the number as hex)
          return `0x${n.toString(16).padStart(64, '0')}`;
        },
        view: async ({ to, data }: { to: string; data: string }) => {
          console.log('Mock relayer.view:', { to, data });
          return { result: "0x" + "0".repeat(64) };
        },
        send: async ({ to, data }: { to: string; data: string }) => {
          console.log('Mock relayer.send:', { to, data });
          return {
            hash: "0x" + Math.random().toString(16).substr(2, 64),
            wait: async () => ({ status: 1 })
          };
        }
      };
    }
  }, [relayerUrl, chainId]);

  const encrypt32 = useCallback(async (n: number) => {
    const r = await get();
    try {
      const ct = await r.encrypt32(n);
      console.log('🔐 encrypt32 ok:', n, '->', ct);
      return ct;
    } catch (e: any) {
      console.error('❌ encrypt32 failed:', e?.message || e, e);
      throw e;
    }
  }, [get]);

  const view = useCallback(async (to: string, data: `0x${string}`) => {
    const r = await get();
    return r.view({ to, data });
  }, [get]);
  
  const send = useCallback(async (to: string, data: `0x${string}`) => {
    const r = await get();
    return r.send({ to, data });
  }, [get]);
  
  return { encrypt32, view, send };
}
