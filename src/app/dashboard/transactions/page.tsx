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

export default function TransactionsPage() {
  const { transactions, addTransaction } = useStore()
  const { t } = useThemeStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showNewModal, setShowNewModal] = useState(false)

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
            {t('transactions.title')}
          </h1>
          <p className="text-gray-500 dark:text-surface-500 mt-1">
            {t('transactions.subtitle')}
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<PlusIcon size={18} />}
          onClick={() => setShowNewModal(true)}
        >
          {t('transactions.addTransaction')}
        </Button>
      </div>

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

      {/* Transactions list */}
      <Card variant="glass" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-surface-800/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-surface-500 uppercase tracking-wider">
                  {t('common.description')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-surface-500 uppercase tracking-wider">
                  {t('common.category')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-surface-500 uppercase tracking-wider">
                  {t('common.date')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-surface-500 uppercase tracking-wider">
                  {t('common.status')}
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-surface-500 uppercase tracking-wider">
                  {t('common.amount')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-surface-800/30">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-surface-500">
                    {t('transactions.noTransactions')}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-surface-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-surface-800/50 flex items-center justify-center">
                          <TransactionsIcon size={20} className={
                            transaction.amount > 0 ? 'text-primary-400' : 'text-red-400'
                          } />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-surface-100">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-surface-500">
                            {transaction.merchant || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="neutral" size="sm">
                        {transaction.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-surface-400">
                      {format(new Date(transaction.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          transaction.status === 'completed'
                            ? 'success'
                            : transaction.status === 'pending'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {transaction.status === 'completed' ? t('transactions.completed') :
                         transaction.status === 'pending' ? t('transactions.pending') :
                         t('transactions.failed')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${
                        transaction.amount > 0 ? 'text-primary-400' : 'text-red-400'
                      }`}>
                        {transaction.amount > 0 ? '+' : '-'}
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
