'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWalletStore } from '@/store/wallet-store'
import { useThemeStore } from '@/store/theme-store'
import { Card, Button, Badge } from '@/components/ui'
import { WalletIcon, TrendUpIcon, TrendDownIcon } from '@/components/ui/Icons'
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Layers,
  Image,
  Wallet,
  Send,
  Download,
  ArrowLeftRight,
  Coins
} from 'lucide-react'

export default function WalletPage() {
  const { wallets, fetchWallets, isLoading } = useWalletStore()
  const { t } = useThemeStore()
  const [activeTab, setActiveTab] = useState<'assets' | 'nfts' | 'defi' | 'history'>('assets')

  // Fetch wallets on mount
  useEffect(() => {
    fetchWallets()
  }, [fetchWallets])

  // Flatten all tokens from all wallets for display
  const allTokens = wallets.flatMap(wallet =>
    wallet.tokens.map(token => ({
      ...token,
      walletName: wallet.name,
      network: wallet.network,
    }))
  )

  const totalValue = wallets.reduce((sum, wallet) => sum + (wallet.totalValueUsd || 0), 0)
  const totalChange24h = allTokens.reduce((sum, token) =>
    sum + ((token.balanceUsd || 0) * (token.price24hChange || 0) / 100), 0
  )
  const changePercentage = totalValue > 0 ? (totalChange24h / (totalValue - totalChange24h)) * 100 : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const tabs = [
    { id: 'assets', label: t('wallet.assets'), icon: Coins },
    { id: 'nfts', label: t('wallet.nfts'), icon: Image },
    { id: 'defi', label: t('wallet.defi'), icon: Layers },
    { id: 'history', label: t('wallet.history'), icon: RefreshCw },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
            {t('wallet.title')}
          </h1>
          <p className="text-gray-500 dark:text-surface-500 mt-1">
            {t('wallet.subtitle')}
          </p>
        </div>
        <Button variant="primary" leftIcon={<Wallet size={18} />}>
          {t('wallet.connectWallet')}
        </Button>
      </div>

      {/* Portfolio Value */}
      <Card variant="glass" padding="lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-surface-400">{t('wallet.totalValue')}</p>
            <p className="text-4xl font-bold text-gray-900 dark:text-surface-100 mt-1">
              {formatCurrency(totalValue)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {changePercentage >= 0 ? (
                <TrendUpIcon size={16} className="text-green-500" />
              ) : (
                <TrendDownIcon size={16} className="text-red-500" />
              )}
              <span className={changePercentage >= 0 ? 'text-green-500' : 'text-red-500'}>
                {changePercentage >= 0 ? '+' : ''}{changePercentage.toFixed(2)}%
              </span>
              <span className="text-gray-500 dark:text-surface-500">24h</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="secondary" leftIcon={<Send size={16} />}>
              {t('wallet.send')}
            </Button>
            <Button variant="secondary" leftIcon={<Download size={16} />}>
              {t('wallet.receive')}
            </Button>
            <Button variant="secondary" leftIcon={<ArrowLeftRight size={16} />}>
              {t('wallet.swap')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-surface-800/50">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                  : 'border-transparent text-gray-500 dark:text-surface-400 hover:text-gray-700 dark:hover:text-surface-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Assets Tab */}
      {activeTab === 'assets' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-2 text-center py-8 text-gray-500 dark:text-surface-500">
              {t('common.loading')}...
            </div>
          ) : allTokens.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-gray-500 dark:text-surface-500">
              {t('wallet.noWallet')}
            </div>
          ) : (
            allTokens.map((token, index) => (
              <motion.div
                key={`${token.contractAddress}-${token.symbol}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="glass" padding="md" hover>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-surface-800/50 flex items-center justify-center text-2xl">
                        {token.symbol === 'BTC' && '₿'}
                        {token.symbol === 'ETH' && 'Ξ'}
                        {token.symbol === 'SOL' && '◎'}
                        {token.symbol === 'USDC' && '$'}
                        {!['BTC', 'ETH', 'SOL', 'USDC'].includes(token.symbol) && token.symbol[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-surface-100">{token.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-surface-500">
                          {token.balance.toFixed(4)} {token.symbol}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-surface-100">
                        {formatCurrency(token.balanceUsd || 0)}
                      </p>
                      <p className={`text-sm ${(token.price24hChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {(token.price24hChange || 0) >= 0 ? '+' : ''}{(token.price24hChange || 0).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* NFTs Tab */}
      {activeTab === 'nfts' && (
        <Card variant="glass" padding="lg">
          <div className="text-center py-12">
            <Image size={48} className="mx-auto text-gray-400 dark:text-surface-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">{t('wallet.noWallet')}</h3>
            <p className="text-gray-500 dark:text-surface-500 mt-2">{t('wallet.connectPrompt')}</p>
            <Button variant="primary" className="mt-4">
              {t('wallet.connectWallet')}
            </Button>
          </div>
        </Card>
      )}

      {/* DeFi Tab */}
      {activeTab === 'defi' && (
        <Card variant="glass" padding="lg">
          <div className="text-center py-12">
            <Layers size={48} className="mx-auto text-gray-400 dark:text-surface-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">{t('wallet.noWallet')}</h3>
            <p className="text-gray-500 dark:text-surface-500 mt-2">{t('wallet.connectPrompt')}</p>
            <Button variant="primary" className="mt-4">
              {t('wallet.connectWallet')}
            </Button>
          </div>
        </Card>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card variant="glass" padding="lg">
          <div className="text-center py-12">
            <RefreshCw size={48} className="mx-auto text-gray-400 dark:text-surface-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">{t('wallet.noWallet')}</h3>
            <p className="text-gray-500 dark:text-surface-500 mt-2">{t('wallet.connectPrompt')}</p>
            <Button variant="primary" className="mt-4">
              {t('wallet.connectWallet')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
