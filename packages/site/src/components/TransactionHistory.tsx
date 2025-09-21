'use client';

import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function TransactionHistory() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-500">Connect your wallet to view transaction history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mock transaction data - in real app, you'd fetch from blockchain
  const mockTransactions = [
    {
      id: 1,
      type: 'Deal Created',
      amount: '1000 USDC',
      status: 'Completed',
      timestamp: '2024-12-19 15:30:00',
      hash: '0x1234...5678'
    },
    {
      id: 2,
      type: 'Token Minted',
      amount: '10000 USDC',
      status: 'Completed',
      timestamp: '2024-12-19 14:20:00',
      hash: '0xabcd...efgh'
    },
    {
      id: 3,
      type: 'Deal Settled',
      amount: '1000 USDC',
      status: 'Completed',
      timestamp: '2024-12-19 13:15:00',
      hash: '0x9876...5432'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <p className="text-sm text-gray-600">
          Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockTransactions.map((tx) => (
            <div key={tx.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{tx.type}</h4>
                  <p className="text-sm text-gray-600">{tx.amount}</p>
                  <p className="text-xs text-gray-500">{tx.timestamp}</p>
                </div>
                <div className="text-right">
                  <Badge variant="success">{tx.status}</Badge>
                  <p className="text-xs text-gray-500 mt-1">{tx.hash}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            View all transactions on{' '}
            <a 
              href={`https://sepolia.etherscan.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Etherscan
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
