'use client';

import { getRelayerInstance, userDecrypt } from './relayer';
import { encrypt32Single, encryptAskThresholdBatch } from './encrypt';

export async function ensureRelayerReady() {
  await getRelayerInstance();
}

export { userDecrypt, encrypt32Single, encryptAskThresholdBatch };