'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTreasuryStore } from '@/store/treasury-store'
import { useThemeStore } from '@/store/theme-store'
import { Card } from '@/components/ui'
import {
  Wallet,
  Building2,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react'
import Link from 'next/link'

export default function TreasuryOverview() {
  const { t, accentColor } = useThemeStore()
  const {
    cashPosition,
    facilities,
    getSummary,
    fetchTreasury,
    isInitialized,
  } = useTreasuryStore()

  useEffect(() => {
    if (!isInitialized) {
      fetchTreasury()
    }
  }, [isInitialized, fetchTreasury])

  const summary = getSummary()

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

  const getUtilizationColor = (percent: number) => {
    if (percent >= 90) return 'text-red-400'
    if (percent >= 75) return 'text-amber-400'
    return 'text-emerald-400'
  }

  const getUtilizationBg = (percent: number) => {
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 75) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const getRiskBadge = (risk: string) => {
    const colors = {
      low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    }
    return colors[risk as keyof typeof colors] || colors.low
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="h-full"
    >
      <Card variant="glass" className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                Treasury
              </h3>
              <p className="text-xs text-gray-500 dark:text-surface-500">
                Cash & Credit Overview
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/treasury"
            className="flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:opacity-80 transition-opacity"
          >
            View Details
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Total Cash */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-gray-500 dark:text-surface-400">Total Cash</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
              {formatCurrency(summary.totalCash, true)}
            </p>
            <p className="text-xs text-gray-500 dark:text-surface-500 mt-1">
              {formatCurrency(summary.availableCash, true)} available
            </p>
          </div>

          {/* Credit Available */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-500 dark:text-surface-400">Credit Available</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
              {formatCurrency(summary.totalCreditAvailable, true)}
            </p>
            <p className={`text-xs mt-1 ${getUtilizationColor(summary.creditUtilization)}`}>
              {summary.creditUtilization.toFixed(1)}% utilized
            </p>
          </div>
        </div>

        {/* Credit Utilization Bar */}
        {facilities.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-surface-400">Credit Utilization</span>
              <span className={`text-xs font-medium ${getUtilizationColor(summary.creditUtilization)}`}>
                {formatCurrency(summary.totalCreditUsed)} / {formatCurrency(summary.totalCreditUsed + summary.totalCreditAvailable)}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(summary.creditUtilization, 100)}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className={`h-full rounded-full ${getUtilizationBg(summary.creditUtilization)}`}
              />
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Risk Level */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${getRiskBadge(summary.overallRisk)}`}>
            {summary.overallRisk === 'low' ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            <span className="text-xs font-medium capitalize">{summary.overallRisk} Risk</span>
          </div>

          {/* Pending Approvals */}
          {summary.pendingApprovals > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs text-amber-400">
                {summary.pendingApprovals} pending approval{summary.pendingApprovals > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Netting Opportunities */}
          {summary.nettingOpportunities > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-400">
                {formatCurrency(summary.potentialSavings, true)} savings
              </span>
            </div>
          )}
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-surface-700/50 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
              {summary.bucketsFunded}
            </p>
            <p className="text-xs text-gray-500 dark:text-surface-500">Buckets Funded</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
              {facilities.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-surface-500">Credit Lines</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
              {summary.activeBreaches}
            </p>
            <p className="text-xs text-gray-500 dark:text-surface-500">Active Alerts</p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
