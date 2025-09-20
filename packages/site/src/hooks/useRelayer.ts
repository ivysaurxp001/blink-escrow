import { useCallback } from "react";

export function useRelayer() {
  const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_URL!;
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID!);

  const get = useCallback(async () => {
    // Mock relayer instance for now
    // In real implementation, use: createInstance({ relayerUrl, chainId })
    return {
      view: async ({ to, data }: { to: string; data: string }) => {
        console.log("Mock relayer.view:", { to, data });
        // Mock result for testing
        return {
          result: "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000003de"
        };
      },
      send: async ({ to, data }: { to: string; data: string }) => {
        console.log("Mock relayer.send:", { to, data });
        // Mock transaction result
        return {
          hash: "0x" + Math.random().toString(16).substr(2, 64),
          wait: async () => ({ status: 1 })
        };
      },
      encrypt32: async (value: number) => {
        console.log("Mock encrypt32:", value);
        // Mock encrypted value
        return "0x" + value.toString(16).padStart(64, '0');
      }
    };
  }, [relayerUrl, chainId]);

  const view = useCallback(async (to: string, data: `0x${string}`) => {
    const r = await get();
    return r.view({ to, data });
  }, [get]);

  const send = useCallback(async (to: string, data: `0x${string}`) => {
    const r = await get();
    return r.send({ to, data });
  }, [get]);

  const encrypt32 = useCallback(async (n: number) => {
    const r = await get();
    return r.encrypt32(n);
  }, [get]);

  return { view, send, encrypt32 };
}
