'use client';

// Dùng module-level promise để chống khởi tạo lặp (kể cả StrictMode)
let relayerPromise: Promise<any> | null = null;

export async function getRelayer() {
  if (!relayerPromise) {
    relayerPromise = (async () => {
      // ⚠️ dynamic import để tránh SSR kéo SDK
      const { createInstance } = await import('@zama-fhe/relayer-sdk/web');
      const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_URL || 'https://relayer.testnet.zama.cloud';
      const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111');
      
      console.log('🔧 Using relayer config:', { relayerUrl, chainId });
      
      console.log('🔗 Creating relayer instance:', { relayerUrl, chainId });
      const relayer = createInstance({ relayerUrl, chainId });
      console.log('✅ Relayer instance created');
      return relayer;
    })();
  }
  return relayerPromise;
}

export async function encrypt32(n: number) {
  try {
    const r = await getRelayer();
    console.log('🔐 Encrypting with relayer:', n);
    const result = await r.encrypt32(n);
    console.log('✅ Encrypted result:', result);
    return result;
  } catch (error) {
    console.warn('⚠️ Relayer encryption failed, using mock:', error);
    // Mock encryption - return bytes32 format
    const bytes32 = `0x${n.toString(16).padStart(64, '0')}`;
    console.log('✅ Mock encrypted result:', bytes32);
    return bytes32;
  }
}

export async function relayerView(to: `0x${string}`, data: `0x${string}`) {
  try {
    const r = await getRelayer();
    console.log('👁️ Relayer view call:', { to, data });
    // { returnData } (hex) → bạn tự decode bằng ABI
    const result = await r.view({ to, data });
    console.log('✅ Relayer view result:', result);
    return result;
  } catch (error) {
    console.warn('⚠️ Relayer view failed, using mock:', error);
    // Mock result: [matched, askClear, bidClear, thresholdClear]
    const mockResult = { returnData: "0x" + "0".repeat(64) };
    console.log('✅ Mock relayer view result:', mockResult);
    return mockResult;
  }
}
