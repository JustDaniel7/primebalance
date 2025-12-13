'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/index'
import { useThemeStore } from '@/store/theme-store'
import { Card, Button, Badge, Input } from '@/components/ui'
import {
  PlusIcon,
  SearchIcon,
  ChevronDownIcon,
  TransactionsIcon,
} from '@/components/ui/Icons'
import { format } from 'date-fns'
import type { Transaction } from '@/types'

import { useEffect } from 'react'
import TransactionModal from '@/components/transactions/TransactionModal'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  // Fetch transactions on mount
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return
    try {
      await deleteTransaction(id)
      toast.success('Transaction deleted')
    } catch (e: any) {
      toast.error(e.message)
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

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' || tx.category === selectedCategory
    const matchesStatus =
      selectedStatus === 'all' || tx.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
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
              className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50 text-gray-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50 text-gray-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* ... thead stays same ... */}
            <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
              {filteredTransactions.map((transaction) => (
                <motion.tr key={transaction.id} /* ... existing props ... */>
                  {/* ... existing cells ... */}
                  
                  {/* Add actions cell */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-gray-500 hover:text-gray-700 dark:hover:text-surface-300 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
