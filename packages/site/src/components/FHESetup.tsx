'use client';

import { useState } from 'react';

export default function FHESetup() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="mt-4 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
      <div className="font-medium text-lg mb-2 text-yellow-800">⚠️ FHE Setup Required</div>
      
      <div className="text-sm text-yellow-700 mb-3">
        FHEVM SDK đã load thành công nhưng gặp lỗi khi tạo instance.
        Hiện tại đang chạy ở <strong>Mock Mode</strong>.
        <br/>
        <span className="text-xs text-yellow-600">
          💡 Có thể do rate limiting từ RPC provider hoặc network issues.
        </span>
      </div>

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="px-3 py-1 text-sm bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
      >
        {showDetails ? 'Ẩn' : 'Xem'} chi tiết setup
      </button>

      {showDetails && (
        <div className="mt-3 p-3 bg-yellow-100 rounded text-sm">
          <div className="font-medium mb-2">Để sử dụng FHE thật:</div>
          
          <div className="space-y-2 text-xs">
            <div>
              <strong>1. KMS Contract Address cho Sepolia:</strong>
              <pre className="mt-1 p-2 bg-white rounded border text-xs">
{`0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC`}
              </pre>
            </div>
            
            <div>
              <strong>2. Hoặc set Mock Mode:</strong>
              <pre className="mt-1 p-2 bg-white rounded border">
{`NEXT_PUBLIC_FHE_MOCK=true`}
              </pre>
            </div>
            
            <div>
              <strong>3. SepoliaConfig + Manual Config:</strong>
              <div className="mt-1 p-2 bg-white rounded border text-xs">
                ✅ KMS: 0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC<br/>
                ✅ ACL: 0x687820221192C5B662b25367F70076A37bc79b6c<br/>
                ✅ Chain ID: 11155111<br/>
                ✅ Relayer: https://relayer.testnet.zama.cloud<br/>
                ✅ Network: https://eth-sepolia.public.blastapi.io
              </div>
            </div>
            
            <div>
              <strong>4. Rate Limiting Issues:</strong>
              <div className="mt-1 p-2 bg-white rounded border text-xs">
                • RPC provider có giới hạn requests<br/>
                • Đã bỏ network URL để tránh rate limit<br/>
                • Mock mode hoàn toàn ổn cho development<br/>
                • FHE thật chỉ cần khi deploy production
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-yellow-600">
            💡 <strong>Tip:</strong> Mock mode hoàn toàn ổn để test flow. 
            FHE thật chỉ cần khi deploy production.
          </div>
        </div>
      )}
    </div>
  );
}
