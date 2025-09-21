'use client';

import { useAccount, useReadContract } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MOCK_TOKENS } from '@/abi/MockTokenAddresses';
import { formatUnits } from 'viem';

// MockToken ABI for balanceOf
const MOCK_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

interface TokenBalanceProps {
  tokenAddress: string;
  tokenName: string;
  decimals: number;
}

function TokenBalanceItem({ tokenAddress, tokenName, decimals }: TokenBalanceProps) {
  const { address } = useAccount();

  const { data: balance, isLoading: balanceLoading } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: MOCK_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: symbol, isLoading: symbolLoading } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: MOCK_TOKEN_ABI,
    functionName: 'symbol',
    query: {
      enabled: !!address,
    },
  });

  if (!address) {
    return (
      <div className="bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-400/20 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-300">{tokenName}</h4>
            <p className="text-sm text-gray-400">Connect wallet to view balance</p>
          </div>
          <Badge className="bg-gray-500/20 text-gray-300 border-gray-400/30">Connect</Badge>
        </div>
      </div>
    );
  }

  if (balanceLoading || symbolLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-white">{tokenName}</h4>
            <p className="text-sm text-gray-300">Loading...</p>
          </div>
          <div className="w-16 h-6 bg-white/20 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  const formattedBalance = balance ? formatUnits(balance, decimals) : '0';
  const displaySymbol = symbol || tokenName;

  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 rounded-lg p-4 backdrop-blur-sm hover:border-blue-400/40 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-white">{tokenName}</h4>
          <p className="text-sm text-gray-300">{displaySymbol}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-white text-lg">
            {parseFloat(formattedBalance).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">{displaySymbol}</p>
        </div>
      </div>
    </div>
  );
}

export function TokenBalance() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <Card className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            💼 Token Portfolio
            <span className="ml-2 text-red-400 text-sm">Not Connected</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <span className="text-2xl">💼</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Connect Your Wallet</h3>
            <p className="text-gray-300">Connect your wallet to view your token balances</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          💼 Token Portfolio
          <span className="ml-2 text-green-400 text-sm">Connected</span>
        </CardTitle>
        <p className="text-sm text-gray-300">
          Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <TokenBalanceItem
          tokenAddress={MOCK_TOKENS.Z_USDC}
          tokenName="Z-USDC"
          decimals={6}
        />
        <TokenBalanceItem
          tokenAddress={MOCK_TOKENS.Z_DAI}
          tokenName="Z-DAI"
          decimals={18}
        />
        
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Total Tokens</span>
            <span className="font-medium text-white">2 Assets</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
