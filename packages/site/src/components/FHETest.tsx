'use client';

import { useState } from 'react';
import { useFhevm } from '../fhevm/useFhevm';

export default function FHETest() {
  const { fhevm, isLoading, error, isMockMode, encrypt32, relayerView } = useFhevm();
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const testEncryption = async () => {
    try {
      setIsTesting(true);
      setTestResult('');

      console.log('🧪 Testing FHE encryption...');
      
      // Test encrypt32
      const testValue = 1234;
      const encrypted = await encrypt32(testValue);
      
      console.log('✅ Encryption test passed:', encrypted);
      
      // Test relayerView
      const viewResult = await relayerView(
        '0x1129D146B01219B965682C61278A582B3367Cd1b' as `0x${string}`, // BlindEscrow contract
        '0x' + '0'.repeat(64) as `0x${string}` // Mock data
      );
      
      console.log('✅ Relayer view test passed:', viewResult);
      
      setTestResult(`✅ FHE Test Passed!
Mode: ${isMockMode ? 'Mock' : 'Real'}
Encrypted: ${JSON.stringify(encrypted, null, 2)}
Relayer: ${JSON.stringify(viewResult, null, 2)}`);
      
    } catch (error: any) {
      console.error('❌ FHE Test failed:', error);
      setTestResult(`❌ FHE Test Failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-4 p-4 rounded-xl bg-white shadow border">
        <div className="font-medium text-lg mb-2">🔐 FHE Test</div>
        <div className="text-sm text-gray-600">Loading FHEVM...</div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 rounded-xl bg-white shadow border">
      <div className="font-medium text-lg mb-2">🔐 FHE Test</div>
      
      <div className="text-sm text-gray-600 mb-3">
        Testing FHEVM integration
        {isMockMode && <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">MOCK MODE</span>}
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-800 rounded text-sm">
          Error: {error}
        </div>
      )}

      <button
        onClick={testEncryption}
        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        disabled={isTesting || !fhevm}
      >
        {isTesting ? 'Testing...' : 'Test FHE'}
      </button>

      {testResult && (
        <div className="mt-3 p-3 bg-gray-100 rounded text-sm">
          <pre className="whitespace-pre-wrap text-xs">{testResult}</pre>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        <div>Chain ID: 11155111 (Sepolia)</div>
        <div>SDK: @zama-fhe/relayer-sdk</div>
        <div>Status: {fhevm ? 'Ready' : 'Not Ready'}</div>
      </div>
    </div>
  );
}
