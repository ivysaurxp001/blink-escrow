'use client';

import { useState } from 'react';
import { encrypt32 } from '@/fhevm/useFhevm';

export default function TestFHE() {
  const [out, setOut] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const doEncrypt = async () => {
    try {
      setLoading(true);
      setOut('');
      
      console.log('🔍 Testing FHE SDK (POC style)...');
      
      const ct = await encrypt32(1234); // demo
      console.log('🔐 encrypt32 ok:', ct);
      
      setOut(JSON.stringify(ct, null, 2));
      alert('✅ Encrypt OK! Check console for details.');
    } catch (e: any) {
      console.error('❌ TestFHE encrypt failed:', e?.message || e, e);
      setOut(`❌ Error: ${e?.message || 'Unknown error'}`);
      alert('❌ Encrypt failed: ' + (e?.message || 'unknown'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-xl bg-white shadow border">
      <div className="font-medium text-lg mb-2">🔐 FHE Quick Test</div>
      <div className="text-sm text-gray-600 mb-3">
        Test FHE SDK encryption independently
      </div>
      
      <button
        onClick={doEncrypt}
        disabled={loading}
        className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Testing...' : 'Test encrypt32(1234)'}
      </button>
      
      {out && (
        <div className="mt-3">
          <div className="text-sm font-medium mb-1">Result:</div>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
            {out}
          </pre>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        <div>Chain ID: {process.env.NEXT_PUBLIC_CHAIN_ID || 'Not set'}</div>
        <div>Relayer URL: {process.env.NEXT_PUBLIC_RELAYER_URL || 'Not set'}</div>
        <div>SDK: @fhevm/sdk (POC style)</div>
      </div>
    </div>
  );
}
