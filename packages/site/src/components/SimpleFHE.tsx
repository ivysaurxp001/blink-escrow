'use client';

import { useState } from 'react';
import { useFhevm } from '../fhevm/useFhevm';
import FHESetup from './FHESetup';

export default function SimpleFHE() {
  const { fhevm, isLoading, error, isMockMode, encrypt32 } = useFhevm();
  const [result, setResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const testFHE = async () => {
    try {
      setIsTesting(true);
      setResult('');
      
      console.log('🔍 Testing FHE...');
      
      // Test encryption
      const testValue = 1234;
      const encrypted = await encrypt32(testValue);
      
      console.log('✅ Encrypted:', encrypted);
      
      setResult(`✅ FHE Test OK! 
Mode: ${isMockMode ? 'Mock' : 'Real'}
Value: ${testValue}
Encrypted: ${JSON.stringify(encrypted, null, 2)}`);
    } catch (error: any) {
      console.error('❌ FHE Test failed:', error);
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-4 p-4 rounded-xl bg-white shadow border">
        <div className="font-medium text-lg mb-2">🔐 Simple FHE Test</div>
        <div className="text-sm text-gray-600">Loading FHEVM...</div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 rounded-xl bg-white shadow border">
      <div className="font-medium text-lg mb-2">🔐 Simple FHE Test</div>
      <div className="text-sm text-gray-600 mb-3">
        Test FHEVM SDK integration
        {isMockMode && <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">MOCK</span>}
      </div>
      
      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-800 rounded text-sm">
          Error: {error}
        </div>
      )}

      {isMockMode && !error && (
        <FHESetup />
      )}
      
      <button
        onClick={testFHE}
        className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        disabled={isTesting || !fhevm}
      >
        {isTesting ? 'Testing...' : 'Test FHE'}
      </button>
      
      {result && (
        <div className="mt-3">
          <div className="text-sm font-medium mb-1">Result:</div>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
            {result}
          </pre>
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