'use client';

import { useState } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { encodeFunctionData, parseAbiItem } from 'viem';
import { MOCK_USDC_ADDRESS, MOCK_DAI_ADDRESS } from '@/abi/MockTokenAddresses';

const DEPLOYER_ADDRESS = '0x963a2d0BE2eb5d785C6E73ec904fcE8d65691773';

// Mock Token ABI for mint function
const MOCK_TOKEN_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export function DeployerMint() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [targetAddress, setTargetAddress] = useState('');
  const [mintAmount, setMintAmount] = useState('1000');
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'DAI'>('USDC');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const isDeployer = address?.toLowerCase() === DEPLOYER_ADDRESS.toLowerCase();

  if (!isConnected) {
    return (
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">🔧</span> Deployer Tools
        </h3>
        <p className="text-gray-300">Please connect your wallet to access deployer tools.</p>
      </div>
    );
  }

  if (!isDeployer) {
    return (
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">🔧</span> Deployer Tools
        </h3>
        <p className="text-gray-300">This feature is only available for the deployer.</p>
        <p className="text-sm text-gray-400 mt-2">
          Deployer: {DEPLOYER_ADDRESS}
        </p>
      </div>
    );
  }

  const handleMint = async () => {
    if (!walletClient || !address || !targetAddress) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setTxHash(null);

    try {
      const tokenAddress = selectedToken === 'USDC' ? MOCK_USDC_ADDRESS : MOCK_DAI_ADDRESS;
      const amount = BigInt(parseFloat(mintAmount) * 1e18); // Convert to wei (18 decimals)

      console.log('🔧 Deployer minting tokens:', {
        token: selectedToken,
        tokenAddress,
        targetAddress,
        amount: mintAmount,
        amountWei: amount.toString()
      });

      // Encode mint function call
      const mintData = encodeFunctionData({
        abi: MOCK_TOKEN_ABI,
        functionName: 'mint',
        args: [targetAddress as `0x${string}`, amount]
      });

      // Send transaction
      const hash = await walletClient.sendTransaction({
        to: tokenAddress as `0x${string}`,
        data: mintData,
        account: address,
        gas: BigInt(200000),
      });

      console.log('✅ Mint transaction sent:', hash);
      setTxHash(hash);

      // Wait for transaction receipt
      if (!publicClient) throw new Error("No public client");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      console.log('✅ Mint transaction confirmed:', receipt);

      if (receipt.status === 'success') {
        alert(`Successfully minted ${mintAmount} ${selectedToken} to ${targetAddress}`);
        setTargetAddress('');
        setMintAmount('1000');
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error) {
      console.error('❌ Failed to mint tokens:', error);
      alert(`Failed to mint tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <span className="mr-2">🔧</span> Deployer Tools - Mint Tokens
      </h3>
      
      <div className="space-y-4">
        {/* Token Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Token
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="USDC"
                checked={selectedToken === 'USDC'}
                onChange={(e) => setSelectedToken(e.target.value as 'USDC' | 'DAI')}
                className="mr-2"
              />
              <span className="text-white">USDC</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="DAI"
                checked={selectedToken === 'DAI'}
                onChange={(e) => setSelectedToken(e.target.value as 'USDC' | 'DAI')}
                className="mr-2"
              />
              <span className="text-white">DAI</span>
            </label>
          </div>
        </div>

        {/* Target Address */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Address
          </label>
          <input
            type="text"
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount ({selectedToken})
          </label>
          <input
            type="number"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            placeholder="1000"
            min="0"
            step="0.01"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Mint Button */}
        <button
          onClick={handleMint}
          disabled={isLoading || !targetAddress || !mintAmount}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-green-500/25 transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-none"
        >
          {isLoading ? 'Minting...' : `Mint ${mintAmount} ${selectedToken}`}
        </button>

        {/* Transaction Hash */}
        {txHash && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-400/20 rounded-lg">
            <p className="text-sm text-green-300 mb-1">Transaction Hash:</p>
            <p className="text-xs text-green-200 break-all">{txHash}</p>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              View on Etherscan
            </a>
          </div>
        )}

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/20 rounded-lg">
          <p className="text-xs text-blue-300">
            <strong>Note:</strong> This feature is only available for the deployer address. 
            Tokens minted are test tokens with no real value.
          </p>
        </div>
      </div>
    </div>
  );
}
