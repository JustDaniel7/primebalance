'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/index'
import { Card, Button, Badge, Input } from '@/components/ui'
import {
  PlusIcon,
  SearchIcon,
  ChevronDownIcon,
  TransactionsIcon,
} from '@/components/ui/Icons'
import { format } from 'date-fns'
import type { Transaction } from '@/types'

const categories = [
  'All Categories',
  'Sales Revenue',
  'Subscription Revenue',
  'Cloud Infrastructure',
  'Professional Services',
  'Office Expenses',
  'Crypto Exchange',
]

const statuses = ['All Status', 'completed', 'pending', 'failed']

export default function TransactionsPage() {
  const { transactions, addTransaction } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [selectedStatus, setSelectedStatus] = useState('All Status')
  const [showNewModal, setShowNewModal] = useState(false)

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === 'All Categories' || t.category === selectedCategory
    const matchesStatus =
      selectedStatus === 'All Status' || t.status === selectedStatus
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
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = filteredTransactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-100 font-display">
            Transactions
          </h1>
          <p className="text-surface-500 mt-1">
            Manage and track all your financial transactions
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<PlusIcon size={18} />}
          onClick={() => setShowNewModal(true)}
        >
          New Transaction
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" padding="md">
          <p className="text-sm text-surface-400">Total Income</p>
          <p className="text-2xl font-bold text-primary-400 mt-1">
            +{formatCurrency(totalIncome, 'USD')}
          </p>
        </Card>
        <Card variant="glass" padding="md">
          <p className="text-sm text-surface-400">Total Expenses</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            -{formatCurrency(totalExpenses, 'USD')}
          </p>
        </Card>
        <Card variant="glass" padding="md">
          <p className="text-sm text-surface-400">Net Flow</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              totalIncome - totalExpenses >= 0
                ? 'text-primary-400'
                : 'text-red-400'
            }`}
          >
            {totalIncome - totalExpenses >= 0 ? '+' : ''}
            {formatCurrency(totalIncome - totalExpenses, 'USD')}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="glass" padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<SearchIcon size={18} />}
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 rounded-xl bg-surface-900/60 border border-surface-700/50 text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none"
              />
            </div>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 rounded-xl bg-surface-900/60 border border-surface-700/50 text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === 'All Status'
                      ? status
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Transactions table */}
      <Card variant="glass" padding="none">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Date</th>
                <th>Category</th>
                <th>Account</th>
                <th>Status</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction, index) => (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="cursor-pointer"
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          transaction.amount > 0
                            ? 'bg-primary-500/10'
                            : 'bg-surface-700/50'
                        }`}
                      >
                        <TransactionsIcon
                          size={16}
                          className={
                            transaction.amount > 0
                              ? 'text-primary-400'
                              : 'text-surface-400'
                          }
                        />
                      </div>
                      <div>
                        <p className="font-medium text-surface-200">
                          {transaction.description}
                        </p>
                        {transaction.tokenized && (
                          <p className="text-xs text-surface-500 mt-0.5 font-mono">
                            {transaction.txHash}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-surface-400">
                    {format(new Date(transaction.date), 'MMM d, yyyy')}
                  </td>
                  <td>
                    <Badge variant="neutral" size="sm">
                      {transaction.category}
                    </Badge>
                  </td>
                  <td className="text-surface-400">{transaction.account}</td>
                  <td>
                    <Badge
                      variant={
                        transaction.status === 'completed'
                          ? 'success'
                          : transaction.status === 'pending'
                          ? 'warning'
                          : 'danger'
                      }
                      dot
                      size="sm"
                    >
                      {transaction.status}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <span
                      className={`font-semibold ${
                        transaction.amount > 0
                          ? 'text-primary-400'
                          : 'text-surface-200'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </span>
                    {transaction.currency !== 'USD' && (
                      <span className="ml-1 text-xs text-surface-500">
                        {transaction.currency}
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="py-12 text-center">
            <TransactionsIcon size={48} className="mx-auto text-surface-600" />
            <p className="mt-4 text-surface-400">No transactions found</p>
            <p className="text-sm text-surface-500">
              Try adjusting your filters or add a new transaction
            </p>
          </div>
        )}
      </Card>

      {/* New Transaction Modal */}
      <AnimatePresence>
        {showNewModal && (
          <NewTransactionModal onClose={() => setShowNewModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function NewTransactionModal({ onClose }: { onClose: () => void }) {
  const { addTransaction } = useStore()
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: 'Office Expenses',
    account: 'Business Checking',
    date: new Date().toISOString().split('T')[0],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount =
      formData.type === 'expense'
        ? -Math.abs(parseFloat(formData.amount))
        : Math.abs(parseFloat(formData.amount))

    addTransaction({
      id: Date.now().toString(),
      description: formData.description,
      amount,
      currency: 'USD',
      type: formData.type,
      category: formData.category,
      account: formData.account,
      date: formData.date,
      status: 'completed',
      tags: [],
      tokenized: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md glass-card rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-surface-100 mb-6">
          New Transaction
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Description"
            placeholder="Enter description..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                    formData.type === 'income'
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'bg-surface-800/50 text-surface-400 border border-surface-700/50'
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                    formData.type === 'expense'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-surface-800/50 text-surface-400 border border-surface-700/50'
                  }`}
                >
                  Expense
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl bg-surface-900/60 border border-surface-700/50 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              {categories.slice(1).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Add Transaction
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
