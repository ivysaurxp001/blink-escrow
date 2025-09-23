// packages/site/src/fhevm/relayer.ts
'use client';

// CDN-based approach like new-fhevm-template
const SDK_CDN_URL = "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs";

let instancePromise: Promise<any> | null = null;

// Load SDK from CDN
async function loadSDKFromCDN(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('FHE relayer can only be initialized in the browser');
  }

  // Check if already loaded
  if ('relayerSDK' in window) {
    return;
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${SDK_CDN_URL}"]`);
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = SDK_CDN_URL;
    script.type = "text/javascript";
    script.async = true;

    script.onload = () => {
      if (!('relayerSDK' in window)) {
        reject(new Error('Failed to load relayerSDK from CDN'));
        return;
      }
      resolve();
    };

    script.onerror = () => {
      reject(new Error(`Failed to load Relayer SDK from ${SDK_CDN_URL}`));
    };

    document.head.appendChild(script);
  });
}

export async function getRelayerInstance() {
  if (!instancePromise) {
    instancePromise = (async () => {
      if (typeof window === 'undefined') {
        throw new Error('FHE relayer can only be initialized in the browser');
      }

      // 1) Load SDK from CDN
      await loadSDKFromCDN();

      // 2) Initialize SDK
      const relayerSDK = (window as any).relayerSDK;
      if (!relayerSDK.__initialized__) {
        await relayerSDK.initSDK();
        relayerSDK.__initialized__ = true;
      }

      // 3) Use SepoliaConfig directly (like new-fhevm-template)
      const config = {
        ...relayerSDK.SepoliaConfig,
        network: window.ethereum, // Use MetaMask provider
      };

      // 4) Create instance
      const inst = await relayerSDK.createInstance(config);

      // 5) Preflight check
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
