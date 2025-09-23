// packages/site/src/fhevm/relayer.ts
'use client';

import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';

let instancePromise: Promise<any> | null = null;

export async function getRelayerInstance() {
  if (!instancePromise) {
    instancePromise = (async () => {
      if (typeof window === 'undefined') {
        throw new Error('FHE relayer can only be initialized in the browser');
      }

      // 1) load WASM
      await initSDK();

      // 2) chọn cấu hình
      const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL;  // tùy chọn
      const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111');

      let inst: any;
      if (!RELAYER_URL && CHAIN_ID === 11155111) {
        // dùng preset chuẩn của Zama cho Sepolia
        inst = await createInstance(SepoliaConfig);
      } else {
        // tự override nếu bạn có gateway riêng
        const config = {
          chainId: CHAIN_ID,
          relayerUrl: RELAYER_URL || SepoliaConfig.relayerUrl,
        };
        inst = await createInstance(config);
      }

      // 3) preflight — sẽ throw nếu config sai (URL/chainId mismatch)
      await inst.getPublicKey();
      return inst;
    })();
  }
  return instancePromise;
}

// tiện ích decrypt phía client
export async function userDecrypt<T = unknown>(cipher: any): Promise<T> {
  const inst = await getRelayerInstance();
  return await inst.userDecrypt(cipher);
}
