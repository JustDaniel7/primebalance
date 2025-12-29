'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useReceivablesStore } from '@/store/receivables-store'
import { useThemeStore } from '@/store/theme-store'
import { Card } from '@/components/ui'
import {
  FileText,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  Users,
} from 'lucide-react'
import Link from 'next/link'

export default function ReceivablesOverview() {
  const { t, accentColor, resolvedTheme } = useThemeStore()
  const {
    receivables,
    getSummary,
    getAgingReport,
    fetchReceivables,
    isInitialized,
  } = useReceivablesStore()

  useEffect(() => {
    if (!isInitialized) {
      fetchReceivables()
    }
  }, [isInitialized, fetchReceivables])

  const summary = getSummary()
  const agingReport = getAgingReport()

  const formatCurrency = (value: number, compact = false) => {
    if (compact && Math.abs(value) >= 1000000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Aging bucket colors
  const agingColors = {
    '0-30': { bar: 'bg-emerald-500', text: 'text-emerald-400', label: 'Current' },
    '31-60': { bar: 'bg-amber-500', text: 'text-amber-400', label: '31-60 days' },
    '61-90': { bar: 'bg-orange-500', text: 'text-orange-400', label: '61-90 days' },
    '90+': { bar: 'bg-red-500', text: 'text-red-400', label: '90+ days' },
  }

  // Calculate total for aging percentage
  const totalAging = Object.values(summary.aging || {}).reduce(
    (sum, bucket) => sum + bucket.amount,
    0
  )

  const getAgingPercentage = (bucket: string) => {
    const amount = summary.aging?.[bucket as keyof typeof summary.aging]?.amount || 0
    return totalAging > 0 ? (amount / totalAging) * 100 : 0
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-full"
    >
      <Card variant="glass" className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                Receivables
              </h3>
              <p className="text-xs text-gray-500 dark:text-surface-500">
                Accounts Receivable Overview
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/receivables"
            className="flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:opacity-80 transition-opacity"
          >
            View Details
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Total Outstanding */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-gray-500 dark:text-surface-400">Outstanding</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
              {formatCurrency(summary.totalOutstanding, true)}
            </p>
            <p className="text-xs text-gray-500 dark:text-surface-500 mt-1">
              {summary.totalReceivables} invoices
            </p>
          </div>

          {/* Overdue */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-gray-500 dark:text-surface-400">Overdue</span>
            </div>
            <p className="text-xl font-bold text-red-400">
              {formatCurrency(summary.totalOverdue, true)}
            </p>
            <p className="text-xs text-red-400/70 mt-1">
              {summary.overdueRate.toFixed(1)}% of total
            </p>
          </div>
        </div>

        {/* Aging Breakdown */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-surface-400">
              Aging Breakdown
            </span>
            <span className="text-xs text-gray-500 dark:text-surface-500">
              DSO: {summary.dso.toFixed(0)} days
            </span>
          </div>

          {/* Stacked Bar */}
          <div className="h-3 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden flex">
            {(['0-30', '31-60', '61-90', '90+'] as const).map((bucket, index) => {
              const percentage = getAgingPercentage(bucket)
              return percentage > 0 ? (
                <motion.div
                  key={bucket}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className={`h-full ${agingColors[bucket].bar}`}
                />
              ) : null
            })}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {(['0-30', '31-60', '61-90', '90+'] as const).map((bucket) => {
              const amount = summary.aging?.[bucket]?.amount || 0
              const count = summary.aging?.[bucket]?.count || 0
              return (
                <div key={bucket} className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className={`w-2 h-2 rounded-full ${agingColors[bucket].bar}`} />
                    <span className="text-[10px] text-gray-500 dark:text-surface-500">
                      {agingColors[bucket].label}
                    </span>
                  </div>
                  <p className={`text-xs font-medium ${agingColors[bucket].text}`}>
                    {formatCurrency(amount, true)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="mb-6">
          <span className="text-xs font-medium text-gray-500 dark:text-surface-400 mb-3 block">
            Risk Distribution
          </span>
          <div className="flex items-center gap-2">
            {(['low', 'medium', 'high', 'critical'] as const).map((risk) => {
              const riskData = summary.byRisk?.[risk]
              const count = riskData?.count || 0
              const colors = {
                low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                critical: 'bg-red-500/10 text-red-400 border-red-500/20',
              }
              return (
                <div
                  key={risk}
                  className={`flex-1 px-2 py-2 rounded-lg border ${colors[risk]} text-center`}
                >
                  <p className="text-sm font-semibold">{count}</p>
                  <p className="text-[10px] capitalize">{risk}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="pt-4 border-t border-gray-200 dark:border-surface-700/50 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                {summary.dso.toFixed(0)}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-surface-500">DSO (days)</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                {summary.totalReceivables}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-surface-500">Invoices</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                {summary.byStatus?.['disputed']?.count || 0}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-surface-500">Disputed</p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
