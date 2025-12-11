// src/components/transactions/TransactionModal.tsx
// NEW FILE: Modal for creating/editing transactions

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store'
import { Button, Input, Card } from '@/components/ui'
import { X, Loader2 } from 'lucide-react'
import type { Transaction } from '@/types'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction?: Transaction | null // null = create, Transaction = edit
}

const categories = [
  { value: 'Sales Revenue', label: 'Sales Revenue' },
  { value: 'Subscription Revenue', label: 'Subscription Revenue' },
  { value: 'Cloud Infrastructure', label: 'Cloud Infrastructure' },
  { value: 'Professional Services', label: 'Professional Services' },
  { value: 'Office Expenses', label: 'Office Expenses' },
  { value: 'Crypto Exchange', label: 'Crypto Exchange' },
  { value: 'Other', label: 'Other' },
]

const transactionTypes = [
  { value: 'income', label: 'Income', color: 'text-emerald-500' },
  { value: 'expense', label: 'Expense', color: 'text-red-500' },
  { value: 'transfer', label: 'Transfer', color: 'text-blue-500' },
]

export default function TransactionModal({ isOpen, onClose, transaction }: TransactionModalProps) {
  const { accounts, addTransaction, updateTransaction, isLoading } = useStore()
  const [error, setError] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    category: 'Other',
    accountId: '',
    status: 'pending',
    tags: '',
  })

  // Reset form when modal opens/closes or transaction changes
  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        setForm({
          date: transaction.date.split('T')[0],
          description: transaction.description,
          amount: Math.abs(transaction.amount).toString(),
          type: transaction.type as 'income' | 'expense' | 'transfer',
          category: transaction.category || 'Other',
          accountId: transaction.accountId || '',
          status: transaction.status,
          tags: transaction.tags?.join(', ') || '',
        })
      } else {
        setForm({
          date: new Date().toISOString().split('T')[0],
          description: '',
          amount: '',
          type: 'expense',
          category: 'Other',
          accountId: accounts.find(a => a.type === 'bank')?.id || '',
          status: 'pending',
          tags: '',
        })
      }
      setError(null)
    }
  }, [isOpen, transaction, accounts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!form.description.trim()) {
      setError('Description is required')
      return
    }
    if (!form.amount || isNaN(parseFloat(form.amount))) {
      setError('Valid amount is required')
      return
    }
    if (!form.accountId) {
      setError('Account is required')
      return
    }

    const amount = parseFloat(form.amount)
    const finalAmount = form.type === 'expense' ? -Math.abs(amount) : Math.abs(amount)

    const data = {
      date: form.date,
      description: form.description.trim(),
      amount: finalAmount,
      currency: 'USD',
      type: form.type,
      category: form.category,
      accountId: form.accountId,
      status: form.status,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    }

    try {
      if (transaction) {
        await updateTransaction(transaction.id, data)
      } else {
        await addTransaction(data)
      }
      onClose()
    } catch (e: any) {
      setError(e.message || 'Failed to save transaction')
    }
  }

  // Filter to only show selectable accounts (not parent categories)
  const selectableAccounts = accounts.filter(a => 
    ['bank', 'crypto', 'liability'].includes(a.type)
  )

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="w-full max-w-lg"
        >
          <Card className="p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                {transaction ? 'Edit Transaction' : 'New Transaction'}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}

              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
                  Type
                </label>
                <div className="flex gap-2">
                  {transactionTypes.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm({ ...form, type: t.value as any })}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        form.type === t.value
                          ? t.value === 'income'
                            ? 'bg-emerald-500/20 text-emerald-500 ring-1 ring-emerald-500'
                            : t.value === 'expense'
                            ? 'bg-red-500/20 text-red-500 ring-1 ring-red-500'
                            : 'bg-blue-500/20 text-blue-500 ring-1 ring-blue-500'
                          : 'bg-surface-100 dark:bg-surface-800 text-gray-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Amount row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g., Client payment, Office supplies..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Category & Account row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">
                    Account
                  </label>
                  <select
                    value={form.accountId}
                    onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select account...</option>
                    {selectableAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">
                  Tags <span className="text-gray-400 font-normal">(comma separated)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., client, recurring, q4"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-gray-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {transaction ? 'Save Changes' : 'Create Transaction'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}