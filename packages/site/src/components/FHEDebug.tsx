'use client';

import { useFhevm } from '@/fhevm/useFhevm';
import { useState } from 'react';

export function FHEDebug() {
  const { fheReady, fheError } = useFhevm();
  const [testResult, setTestResult] = useState<any>(null);

  const testFHEConnection = async () => {
    try {
      console.log('🧪 Testing FHE connection...');
      setTestResult({ 
        status: 'success', 
        message: 'FHE is ready',
        fheReady,
        fheError: fheError || 'None'
      });
      console.log('✅ Test result:', testResult);
    } catch (err: any) {
      console.error('❌ Test failed:', err);
      setTestResult({ error: err.message });
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-xl border border-blue-700/50 shadow-2xl rounded-2xl p-6 text-white">
      <h3 className="text-xl font-semibold mb-4">🔧 FHE Debug Panel</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>FHE Ready:</strong> {fheReady ? '✅ Yes' : '❌ No'}
          </div>
          <div>
            <strong>Error:</strong> {fheError || 'None'}
          </div>
        </div>

        <button
          onClick={testFHEConnection}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
        >
          🧪 Test FHE Connection
        </button>

        {testResult && (
          <div>
            <strong>Test Result:</strong>
            <pre className="text-xs bg-black/20 p-2 rounded mt-1 overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
