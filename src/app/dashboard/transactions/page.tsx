'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/store'
import { useThemeStore } from '@/store/theme-store'
import { useArchiveStore } from '@/store/archive-store'
import { useWalletStore, WalletTransaction } from '@/store/wallet-store'
import { Card, Button, Badge } from '@/components/ui'
import {
  PlusIcon,
  SearchIcon,
} from '@/components/ui/Icons'
import { format } from 'date-fns'
import type { Transaction } from '@/types'
import TransactionModal from '@/components/transactions/TransactionModal'
import { Loader2, Pencil, Trash2, Archive } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TransactionsPage() {
  const {
    transactions,
    fetchTransactions,
    deleteTransaction,
    isLoading,
    error
  } = useStore()
  const { t } = useThemeStore()
  const { createArchive } = useArchiveStore()
  const { wallets, fetchWallets, fetchTransactions: fetchWalletTransactions, isInitialized: walletsInitialized } = useWalletStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedSource, setSelectedSource] = useState<'all' | 'regular' | 'wallet'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([])
  const [loadingWalletTxs, setLoadingWalletTxs] = useState(false)

  // Fetch transactions on mount
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Fetch wallet transactions
  useEffect(() => {
    if (!walletsInitialized) {
      fetchWallets()
    }
  }, [walletsInitialized, fetchWallets])

  useEffect(() => {
    const loadWalletTransactions = async () => {
      if (wallets.length === 0) return
      setLoadingWalletTxs(true)
      try {
        const allTxs: WalletTransaction[] = []
        for (const wallet of wallets) {
          const txs = await fetchWalletTransactions(wallet.id)
          allTxs.push(...txs)
        }
        // Sort by timestamp descending
        allTxs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setWalletTransactions(allTxs)
      } catch (err) {
        console.error('Failed to load wallet transactions:', err)
      } finally {
        setLoadingWalletTxs(false)
      }
    }
    loadWalletTransactions()
  }, [wallets, fetchWalletTransactions])

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx)
    setShowModal(true)
  }

  const handleArchive = async (tx: Transaction) => {
    if (!confirm('Archive this transaction? It will be moved to the Archive.')) return
    try {
      // First archive the transaction
      await createArchive({
        originalObjectId: tx.id,
        objectType: 'transaction',
        triggerType: 'manual',
        triggerReason: 'User requested archive',
        title: tx.description,
        description: `Transaction: ${tx.description} - ${tx.amount >= 0 ? '+' : ''}${tx.amount} ${tx.currency}`,
        content: {
          originalTransaction: tx,
          archivedAt: new Date().toISOString(),
        },
        amount: Math.abs(tx.amount),
        currency: tx.currency,
        category: 'financial',
        subcategory: tx.category || 'general',
        tags: [tx.category || 'transaction', tx.status],
        effectiveDate: tx.date,
      })
      // Then delete from active transactions
      await deleteTransaction(tx.id)
      toast.success('Transaction archived successfully')
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to archive transaction'
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (id: string) => {
    const tx = transactions.find(t => t.id === id)
    if (tx) {
      // Archive instead of permanent delete
      await handleArchive(tx)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingTransaction(null)
  }

  const categories = [
    { value: 'all', label: t('transactions.allCategories') },
    { value: 'sales', label: 'Sales Revenue' },
    { value: 'subscription', label: 'Subscription Revenue' },
    { value: 'cloud', label: 'Cloud Infrastructure' },
    { value: 'services', label: 'Professional Services' },
    { value: 'office', label: 'Office Expenses' },
    { value: 'crypto', label: 'Crypto Exchange' },
  ]

  const statuses = [
    { value: 'all', label: t('common.all') },
    { value: 'completed', label: t('transactions.completed') },
    { value: 'pending', label: t('transactions.pending') },
    { value: 'failed', label: t('transactions.failed') },
  ]

  const sources = [
    { value: 'all', label: 'All Sources' },
    { value: 'regular', label: 'Regular' },
    { value: 'wallet', label: 'Wallet/Crypto' },
  ]

  // Convert wallet transactions to unified format
  type UnifiedTransaction = Transaction & { source: 'regular' | 'wallet'; walletTxId?: string }

  const unifiedWalletTransactions: UnifiedTransaction[] = walletTransactions.map((wtx) => ({
    id: `wallet-${wtx.id}`,
    walletTxId: wtx.id,
    description: wtx.description || `${wtx.type} - ${wtx.tokenSymbol || wtx.network}`,
    amount: wtx.isIncoming ? Math.abs(wtx.valueUsd || wtx.value) : -Math.abs(wtx.valueUsd || wtx.value),
    currency: 'USD',
    category: 'crypto',
    status: (wtx.status === 'confirmed' ? 'completed' : wtx.status === 'pending' ? 'pending' : 'completed') as 'completed' | 'pending' | 'failed',
    date: wtx.timestamp,
    accountId: '',
    type: wtx.isIncoming ? 'income' : 'expense',
    tags: wtx.tags || [],
    organizationId: '',
    createdAt: wtx.timestamp,
    updatedAt: wtx.timestamp,
    source: 'wallet' as const,
  }))

  const regularTransactions: UnifiedTransaction[] = transactions.map((tx) => ({
    ...tx,
    source: 'regular' as const,
  }))

  // Combine and filter transactions
  const allTransactions = [...regularTransactions, ...unifiedWalletTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const filteredTransactions = allTransactions.filter((tx) => {
    const matchesSearch = tx.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' || tx.category === selectedCategory
    const matchesStatus =
      selectedStatus === 'all' || tx.status === selectedStatus
    const matchesSource =
      selectedSource === 'all' || tx.source === selectedSource
    return matchesSearch && matchesCategory && matchesStatus && matchesSource
  })

  const formatCurrency = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'USDC' || currency === 'USDT' ? 'USD' : currency,
      minimumFractionDigits: 2,
    })
    return formatter.format(Math.abs(amount))
  }

  const totalIncome = filteredTransactions
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalExpenses = filteredTransactions
    .filter((tx) => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">
            {t('transactions.title')}
          </h1>
          <p className="text-gray-500 dark:text-surface-400">
            {t('transactions.subtitle')}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          {t('transactions.addTransaction')}
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && transactions.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" padding="md">
          <p className="text-sm text-gray-500 dark:text-surface-400">{t('common.income')}</p>
          <p className="text-2xl font-bold text-primary-400 mt-1">
            +{formatCurrency(totalIncome, 'USD')}
          </p>
        </Card>
        <Card variant="glass" padding="md">
          <p className="text-sm text-gray-500 dark:text-surface-400">{t('common.expense')}</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            -{formatCurrency(totalExpenses, 'USD')}
          </p>
        </Card>
        <Card variant="glass" padding="md">
          <p className="text-sm text-gray-500 dark:text-surface-400">{t('common.balance')}</p>
          <p className={`text-2xl font-bold mt-1 ${
            totalIncome - totalExpenses >= 0 ? 'text-primary-400' : 'text-red-400'
          }`}>
            {totalIncome - totalExpenses >= 0 ? '+' : '-'}
            {formatCurrency(Math.abs(totalIncome - totalExpenses), 'USD')}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="glass" padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <SearchIcon
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-surface-500"
              />
              <input
                type="text"
                placeholder={t('transactions.searchTransactions')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50 text-gray-900 dark:text-surface-100 placeholder:text-gray-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-600 text-gray-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-white dark:bg-surface-800 text-gray-900 dark:text-surface-100">
                  {cat.label}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-600 text-gray-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 cursor-pointer"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value} className="bg-white dark:bg-surface-800 text-gray-900 dark:text-surface-100">
                  {status.label}
                </option>
              ))}
            </select>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as 'all' | 'regular' | 'wallet')}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-600 text-gray-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 cursor-pointer"
            >
              {sources.map((source) => (
                <option key={source.value} value={source.value} className="bg-white dark:bg-surface-800 text-gray-900 dark:text-surface-100">
                  {source.label}
                </option>
              ))}
            </select>
            {loadingWalletTxs && (
              <div className="flex items-center text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                Loading wallet...
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
              <thead className="bg-surface-50 dark:bg-surface-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-surface-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-surface-400 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-surface-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-surface-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-surface-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-surface-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
            {filteredTransactions.map((transaction) => (
              <motion.tr
                key={transaction.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-surface-50 dark:hover:bg-surface-800/50"
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 dark:text-surface-100">
                    {transaction.description}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-surface-400">
                    {transaction.category}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={transaction.source === 'wallet' ? 'info' : 'neutral'}>
                    {transaction.source === 'wallet' ? '🔗 Wallet' : 'Regular'}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-surface-300">
                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                </td>
                <td className={`px-6 py-4 font-medium ${
                  transaction.amount >= 0 ? 'text-primary-500' : 'text-red-500'
                }`}>
                  {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount, transaction.currency)}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={transaction.status === 'completed' ? 'success' : transaction.status === 'pending' ? 'warning' : 'danger'}>
                    {transaction.status}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {transaction.source === 'regular' ? (
                      <>
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-gray-500 hover:text-gray-700 dark:hover:text-surface-300 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleArchive(transaction)}
                          className="p-1.5 rounded-lg hover:bg-amber-500/10 text-gray-500 hover:text-amber-500 transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors"
                          title="Delete (Archives first)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-surface-500 italic">
                        Blockchain (read-only)
                      </span>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <TransactionModal
        isOpen={showModal}
        onClose={handleCloseModal}
        transaction={editingTransaction}
      />
    </div>
  )
}
