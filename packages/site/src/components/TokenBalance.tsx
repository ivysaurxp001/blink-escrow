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
      <div className="border rounded-lg p-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-600">{tokenName}</h4>
            <p className="text-sm text-gray-500">Connect wallet to view balance</p>
          </div>
          <Badge variant="info">Connect</Badge>
        </div>
      </div>
    );
  }

  if (balanceLoading || symbolLoading) {
    return (
      <div className="border rounded-lg p-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-600">{tokenName}</h4>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
          <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  const formattedBalance = balance ? formatUnits(balance, decimals) : '0';
  const displaySymbol = symbol || tokenName;

  return (
    <div className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">{tokenName}</h4>
          <p className="text-sm text-gray-600">{displaySymbol}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">
            {parseFloat(formattedBalance).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">{displaySymbol}</p>
        </div>
      </div>
    </div>
  );
}

export function TokenBalance() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Token Portfolio</span>
            <Badge variant="info">Connect Wallet</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💼</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-500">Connect your wallet to view your token balances</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Token Portfolio</span>
          <Badge variant="success">Connected</Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <TokenBalanceItem
          tokenAddress={MOCK_TOKENS.MOCK_USDC}
          tokenName="Mock USDC"
          decimals={6}
        />
        <TokenBalanceItem
          tokenAddress={MOCK_TOKENS.MOCK_DAI}
          tokenName="Mock DAI"
          decimals={18}
        />
        
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Tokens</span>
            <span className="font-medium text-gray-900">2 Assets</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
