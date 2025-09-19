"use client";

import Link from "next/link";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useAutoSwitchNetwork } from "@/hooks/useAutoSwitchNetwork";

export default function Home() {
  const { accounts, isConnected, connect, chainId, error } = useMetaMaskEthersSigner();
  const { isOnSepolia, isSwitching, switchError, switchToSepolia } = useAutoSwitchNetwork();
  
  // Debug info
  console.log("MetaMask state:", { accounts, isConnected, chainId, error });
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Blind Escrow
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            OTC Trading với Fully Homomorphic Encryption (FHE) trên FHEVM. 
            Giao dịch với giá ẩn, an toàn và minh bạch.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!isConnected ? (
              <button
                onClick={connect}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Kết nối MetaMask
              </button>
            ) : isOnSepolia ? (
              <Link 
                href="/blind-escrow"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Bắt đầu giao dịch
              </Link>
            ) : (
              <button
                onClick={switchToSepolia}
                disabled={isSwitching}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                {isSwitching ? "Đang chuyển..." : "Chuyển sang Sepolia"}
              </button>
            )}
            
            <a 
              href="https://github.com/zama-ai/fhevm" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Tìm hiểu FHEVM
            </a>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
              <p><strong>Lỗi MetaMask:</strong> {error.message}</p>
              <p className="text-sm mt-1">Vui lòng cài đặt MetaMask extension</p>
            </div>
          )}
          
          {switchError && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
              <p><strong>Lỗi chuyển network:</strong> {switchError}</p>
            </div>
          )}
          
          {isConnected && (
            <div className="mt-4 text-sm text-gray-600">
              <p>Đã kết nối: <span className="font-mono">{accounts?.[0]}</span></p>
              <p>Mạng: {isOnSepolia ? "✅ Sepolia" : `❌ Chain ID: ${chainId}`}</p>
              {!isOnSepolia && (
                <p className="text-orange-600 mt-2">
                  ⚠️ Vui lòng chuyển sang mạng Sepolia để sử dụng dApp
                </p>
              )}
            </div>
          )}
          
          {!isConnected && !error && (
            <div className="mt-4 text-sm text-gray-600">
              <p>MetaMask chưa được phát hiện</p>
              <p className="text-xs mt-1">Vui lòng cài đặt MetaMask extension và refresh trang</p>
            </div>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="text-blue-600 text-3xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Bảo mật cao</h3>
            <p className="text-gray-600">
              Sử dụng Fully Homomorphic Encryption để bảo vệ thông tin giá cả
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="text-green-600 text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Giao dịch nhanh</h3>
            <p className="text-gray-600">
              So khớp giá tự động và thanh toán ngay lập tức
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="text-purple-600 text-3xl mb-4">🌐</div>
            <h3 className="text-xl font-semibold mb-2">Phi tập trung</h3>
            <p className="text-gray-600">
              Chạy trên blockchain, không cần trung gian
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Cách hoạt động
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-semibold mb-2">Tạo Deal</h4>
              <p className="text-sm text-gray-600">Seller tạo deal và escrow tài sản</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-semibold mb-2">Submit Giá</h4>
              <p className="text-sm text-gray-600">Cả hai bên submit giá đã mã hóa</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-semibold mb-2">Reveal</h4>
              <p className="text-sm text-gray-600">Kiểm tra khớp giá trong trạng thái mã hóa</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">4</span>
              </div>
              <h4 className="font-semibold mb-2">Settle</h4>
              <p className="text-sm text-gray-600">Hoàn thành giao dịch nếu khớp</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
