'use client';

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { sepolia } from 'wagmi/chains'
import { useCallback, useMemo, useState, useEffect } from 'react'
import Link from 'next/link'

export default function WalletButton() {
  const { address, isConnected, chain } = useAccount()
  const { connectAsync, connectors, status: connectStatus } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { switchChainAsync } = useSwitchChain()
  const [busy, setBusy] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const injectedConnector = useMemo(() => {
    return connectors.find(c => c.type === 'injected')
  }, [connectors])

  const connectWallet = useCallback(async () => {
    try {
      setBusy(true)

      // 1) Kiểm tra MetaMask có cài không
      if (!injectedConnector) {
        throw new Error('MetaMask not detected. Please install the extension.')
      }

      // 2) Thử disconnect trước để tránh state treo
      try { await disconnectAsync() } catch {}

      // 3) Connect – sẽ trigger eth_requestAccounts
      const res = await connectAsync({ connector: injectedConnector })
      // 4) Đảm bảo có ít nhất 1 account
      if (!res.accounts || res.accounts.length === 0) {
        throw new Error('wallet must has at least one account')
      }

      // 5) Đổi sang Sepolia nếu đang ở chain khác
      if (!res.chainId || res.chainId !== sepolia.id) {
        await switchChainAsync({ chainId: sepolia.id })
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error)
      console.error('Error details:', {
        code: error?.code,
        message: error?.message,
        data: error?.data,
      })
      alert(error?.message || 'Failed to connect wallet.')
    } finally {
      setBusy(false)
    }
  }, [connectAsync, disconnectAsync, injectedConnector, switchChainAsync])

  const disconnectWallet = useCallback(async () => {
    try {
      setBusy(true)
      await disconnectAsync()
    } finally {
      setBusy(false)
    }
  }, [disconnectAsync])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="inline-flex items-center px-6 py-3 rounded-full bg-gray-500/20 backdrop-blur-sm border border-gray-500/30 text-white">
        <div className="w-4 h-4 mr-2 bg-gray-400 rounded animate-pulse"></div>
        <span className="text-sm font-medium">Loading...</span>
      </div>
    )
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-3">
        <Link 
          href="/portfolio"
          className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/30 text-white hover:border-blue-500/50 transition-all duration-300"
        >
          <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-sm font-medium">Portfolio</span>
        </Link>
        
        <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30 text-white">
          <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <button
            onClick={disconnectWallet}
            disabled={busy}
            className="ml-2 text-xs text-gray-300 hover:text-white underline"
          >
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={connectWallet}
      disabled={busy || connectStatus === 'pending'}
      className="group bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 text-white shadow-2xl hover:shadow-green-500/25 transform hover:-translate-y-2 transition-all duration-300 px-8 py-4 text-lg font-semibold"
    >
      <svg className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
      {busy ? 'Connecting…' : 'Connect Wallet'}
    </button>
  )
}
