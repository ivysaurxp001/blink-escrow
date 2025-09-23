'use client';

import { TokenBalance } from '@/components/TokenBalance';
import { DealHistory } from '@/components/DealHistory';
import { DeployerMint } from '@/components/DeployerMint';
import { FHEDebug } from '@/components/FHEDebug';
import WalletButton from '@/components/WalletButton';
import { useAccount } from 'wagmi';
import Link from 'next/link';

export default function PortfolioPage() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Portfolio
            </h1>
            <p className="text-gray-300">View your token balances, deal history, and transaction records</p>
          </div>
          <div className="flex items-center gap-4">
            {!isConnected && <WalletButton />}
            <Link 
              href="/marketplace"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-0.5"
            >
              🏪 Marketplace
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Token Portfolio */}
          <div>
            <TokenBalance />
          </div>

          {/* Deal History */}
          <div>
            <DealHistory />
          </div>
        </div>

        {/* Deployer Tools */}
        <div className="mt-8">
          <DeployerMint />
        </div>

        {/* FHE Debug Panel */}
        <div className="mt-8">
          <FHEDebug />
        </div>

        {/* Additional Info */}
        <div className="mt-8">
          <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="mr-2">ℹ️</span> Portfolio Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 rounded-lg p-4 backdrop-blur-sm">
                <h4 className="font-medium text-blue-300 mb-2 flex items-center">
                  <span className="mr-2">🪙</span> Mock Tokens
                </h4>
                <p className="text-gray-300">These are test tokens for the Sepolia testnet. They have no real value.</p>
              </div>
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/20 rounded-lg p-4 backdrop-blur-sm">
                <h4 className="font-medium text-green-300 mb-2 flex items-center">
                  <span className="mr-2">🔒</span> Blind Escrow
                </h4>
                <p className="text-gray-300">Use these tokens to create and participate in blind escrow deals.</p>
              </div>
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-400/20 rounded-lg p-4 backdrop-blur-sm">
                <h4 className="font-medium text-orange-300 mb-2 flex items-center">
                  <span className="mr-2">⚡</span> Getting Tokens
                </h4>
                <p className="text-gray-300">Run the mint script to get test tokens for your wallet address.</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-lg p-4 backdrop-blur-sm">
                <h4 className="font-medium text-purple-300 mb-2 flex items-center">
                  <span className="mr-2">🔧</span> Deployer Tools
                </h4>
                <p className="text-gray-300">Deployer can mint tokens for any address using the tools above.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
