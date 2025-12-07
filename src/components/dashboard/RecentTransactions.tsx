'use client'

import { motion } from 'framer-motion'
import { useStore } from '@/index'
import { Card, Badge } from '@/components/ui'
import { ChevronRightIcon } from '@/components/ui/Icons'
import Link from 'next/link'
import { format } from 'date-fns'

export default function RecentTransactions() {
  const { transactions } = useStore()
  const recentTransactions = transactions.slice(0, 5)

  const formatCurrency = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'USDC' || currency === 'USDT' ? 'USD' : currency,
      minimumFractionDigits: 2,
    })
    return formatter.format(Math.abs(amount))
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Sales Revenue': '💰',
      'Cloud Infrastructure': '☁️',
      'Professional Services': '👔',
      'Subscription Revenue': '🔄',
      'Office Expenses': '📎',
      'Crypto Exchange': '🔗',
    }
    return icons[category] || '📋'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card variant="glass">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-surface-100">
              Recent Transactions
            </h3>
            <p className="text-sm text-surface-500">
              Latest activity in your accounts
            </p>
          </div>
          <Link
            href="/dashboard/transactions"
            className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            View all
            <ChevronRightIcon size={16} />
          </Link>
        </div>

        <div className="space-y-3">
          {recentTransactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              className="flex items-center gap-4 p-4 rounded-xl bg-surface-900/40 hover:bg-surface-800/50 transition-colors cursor-pointer group"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center text-lg">
                {getCategoryIcon(transaction.category)}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-200 truncate group-hover:text-surface-100 transition-colors">
                  {transaction.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-surface-500">
                    {format(new Date(transaction.date), 'MMM d, yyyy')}
                  </span>
                  <span className="text-xs text-surface-600">•</span>
                  <span className="text-xs text-surface-500">
                    {transaction.account}
                  </span>
                </div>
              </div>

              {/* Amount & Status */}
              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${
                    transaction.amount > 0
                      ? 'text-primary-400'
                      : 'text-surface-200'
                  }`}
                >
                  {transaction.amount > 0 ? '+' : ''}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </p>
                <div className="mt-1">
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
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}
