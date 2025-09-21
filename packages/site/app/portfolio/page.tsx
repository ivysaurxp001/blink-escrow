'use client';

import { TokenBalance } from '@/components/TokenBalance';
import { DeploymentInfo } from '@/components/DeploymentInfo';
import { TransactionHistory } from '@/components/TransactionHistory';
import WalletButton from '@/components/WalletButton';
import { useAccount } from 'wagmi';
import Link from 'next/link';

export default function PortfolioPage() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Portfolio</h1>
            <p className="text-gray-300">View your token balances and transaction history</p>
          </div>
          <div className="flex items-center gap-4">
            {!isConnected && <WalletButton />}
            <Link 
              href="/marketplace"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Marketplace
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Token Portfolio */}
          <div>
            <TokenBalance />
          </div>

          {/* Transaction History */}
          <div>
            <TransactionHistory />
          </div>

          {/* Deployment Information */}
          <div>
            <DeploymentInfo />
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Portfolio Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Mock Tokens</h4>
                <p className="text-gray-300">These are test tokens for the Sepolia testnet. They have no real value.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Blind Escrow</h4>
                <p className="text-gray-300">Use these tokens to create and participate in blind escrow deals.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Getting Tokens</h4>
                <p className="text-gray-300">Run the mint script to get test tokens for your wallet address.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
