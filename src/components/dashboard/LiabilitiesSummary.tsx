'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLiabilitiesStore } from '@/store/liabilities-store'
import { useThemeStore } from '@/store/theme-store'
import { Card } from '@/components/ui'
import {
  Landmark,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  Shield,
  Percent,
} from 'lucide-react'
import Link from 'next/link'

export default function LiabilitiesSummary() {
  const { t, resolvedTheme } = useThemeStore()
  const {
    liabilities,
    getSummary,
    getUpcomingMaturities,
    getActiveAlerts,
    fetchLiabilities,
    isInitialized,
  } = useLiabilitiesStore()

  useEffect(() => {
    if (!isInitialized) {
      fetchLiabilities()
    }
  }, [isInitialized, fetchLiabilities])

  const summary = getSummary()
  const upcomingMaturities = getUpcomingMaturities(90)
  const activeAlerts = getActiveAlerts()

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="h-full"
    >
      <Card variant="glass" className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                Liabilities
              </h3>
              <p className="text-xs text-gray-500 dark:text-surface-500">
                Debt & Credit Overview
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/liabilities"
            className="flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:opacity-80 transition-opacity"
          >
            View Details
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Total Liabilities */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="w-4 h-4 text-rose-400" />
              <span className="text-xs text-gray-500 dark:text-surface-400">Total Debt</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
              {formatCurrency(summary.totalLiabilities, true)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-gray-500 dark:text-surface-500">
                ST: {formatCurrency(summary.shortTermTotal, true)}
              </span>
              <span className="text-gray-300 dark:text-surface-600">|</span>
              <span className="text-[10px] text-gray-500 dark:text-surface-500">
                LT: {formatCurrency(summary.longTermTotal, true)}
              </span>
            </div>
          </div>

          {/* Available Credit */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-gray-500 dark:text-surface-400">Credit Headroom</span>
            </div>
            <p className="text-xl font-bold text-emerald-400">
              {formatCurrency(summary.availableCredit, true)}
            </p>
            <p className={`text-xs mt-1 ${getUtilizationColor(summary.utilizationPercent)}`}>
              {summary.utilizationPercent.toFixed(1)}% utilized
            </p>
          </div>
        </div>

        {/* Credit Utilization */}
        {summary.totalCreditLimit > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-surface-400">Credit Utilization</span>
              <span className={`text-xs font-medium ${getUtilizationColor(summary.utilizationPercent)}`}>
                {summary.utilizationPercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(summary.utilizationPercent, 100)}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className={`h-full rounded-full ${getUtilizationBg(summary.utilizationPercent)}`}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-500 dark:text-surface-500">
                Used: {formatCurrency(summary.drawnDebt, true)}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-surface-500">
                Limit: {formatCurrency(summary.totalCreditLimit, true)}
              </span>
            </div>
          </div>
        )}

        {/* Upcoming Maturities */}
        {upcomingMaturities.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 dark:text-surface-400">
                Upcoming Maturities (90 days)
              </span>
              <span className="text-xs text-amber-400">
                {upcomingMaturities.length} items
              </span>
            </div>
            <div className="space-y-2">
              {upcomingMaturities.slice(0, 3).map((liability) => {
                const daysUntil = getDaysUntil(liability.maturityDate!)
                const isUrgent = daysUntil <= 30
                return (
                  <div
                    key={liability.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-surface-800/30"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-400' : 'text-amber-400'}`} />
                      <span className="text-xs text-gray-700 dark:text-surface-300 truncate max-w-[120px]">
                        {liability.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900 dark:text-surface-100">
                        {formatCurrency(liability.totalOutstanding, true)}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        isUrgent
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {daysUntil}d
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 30-day Payments */}
          {summary.upcomingPayments30Days > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-amber-400">
                {formatCurrency(summary.upcomingPayments30Days, true)} due in 30d
              </span>
            </div>
          )}

          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs text-red-400">
                {activeAlerts.length} alert{activeAlerts.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-surface-700/50 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
              {liabilities.filter((l) => l.status === 'active').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-surface-500">Active Debts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
              {summary.upcomingMaturities90Days}
            </p>
            <p className="text-xs text-gray-500 dark:text-surface-500">Maturing (90d)</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Percent className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                {summary.utilizationPercent.toFixed(0)}%
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-surface-500">Utilization</p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
