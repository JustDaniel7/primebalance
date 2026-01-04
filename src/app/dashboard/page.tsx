'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/store'
import { useThemeStore } from '@/store/theme-store'
import { useTreasuryStore } from '@/store/treasury-store'
import { useReceivablesStore } from '@/store/receivables-store'
import { useLiabilitiesStore } from '@/store/liabilities-store'
import {
  MetricCard,
  RevenueChart,
  ExpenseBreakdownChart,
  RecentTransactions,
  AIInsights,
  TreasuryOverview,
  ReceivablesOverview,
  LiabilitiesSummary,
  KPIPerformance,
  QuickActions,
} from '@/components/dashboard'
import { WalletIcon } from '@/components/ui/Icons'
import {
  ArrowDownRight,
  ArrowUpRight,
  Shield,
  TrendingUp,
  Banknote,
  Activity,
} from 'lucide-react'

// Default metrics for when data is loading
const defaultMetrics = {
  totalRevenue: 0,
  totalExpenses: 0,
  netIncome: 0,
  grossMargin: 0,
  operatingMargin: 0,
  cashFlow: 0,
  accountsReceivable: 0,
  accountsPayable: 0,
  currentRatio: 0,
  quickRatio: 0,
  debtToEquity: 0,
  returnOnAssets: 0,
  returnOnEquity: 0,
}

export default function DashboardPage() {
  const { metrics: storeMetrics, cryptoTokens } = useStore()
  const { t } = useThemeStore()
  const { getSummary: getTreasurySummary, isInitialized: treasuryInit, fetchTreasury } = useTreasuryStore()
  const { getSummary: getReceivablesSummary, isInitialized: receivablesInit, fetchReceivables } = useReceivablesStore()
  const { getSummary: getLiabilitiesSummary, isInitialized: liabilitiesInit, fetchLiabilities } = useLiabilitiesStore()

  // Fetch data on mount
  useEffect(() => {
    if (!treasuryInit) fetchTreasury()
    if (!receivablesInit) fetchReceivables()
    if (!liabilitiesInit) fetchLiabilities()
  }, [treasuryInit, receivablesInit, liabilitiesInit, fetchTreasury, fetchReceivables, fetchLiabilities])

  // Use default metrics if store metrics is null
  const metrics = storeMetrics ?? defaultMetrics
  const treasurySummary = getTreasurySummary()
  const receivablesSummary = getReceivablesSummary()
  const liabilitiesSummary = getLiabilitiesSummary()

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

  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(1) + '%'
  }

  const totalCryptoValue = cryptoTokens.reduce((sum, token) => sum + token.usdValue, 0)

  // Calculate working capital
  const workingCapital = receivablesSummary.totalOutstanding - liabilitiesSummary.shortTermTotal

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-500 dark:text-surface-500 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
        {/* Summary badges */}
        <div className="hidden lg:flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            treasurySummary.overallRisk === 'low'
              ? 'bg-emerald-500/10 border border-emerald-500/20'
              : treasurySummary.overallRisk === 'medium'
              ? 'bg-amber-500/10 border border-amber-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <Shield className={`w-4 h-4 ${
              treasurySummary.overallRisk === 'low' ? 'text-emerald-400' :
              treasurySummary.overallRisk === 'medium' ? 'text-amber-400' : 'text-red-400'
            }`} />
            <span className={`text-xs font-medium capitalize ${
              treasurySummary.overallRisk === 'low' ? 'text-emerald-400' :
              treasurySummary.overallRisk === 'medium' ? 'text-amber-400' : 'text-red-400'
            }`}>
              {treasurySummary.overallRisk} Risk
            </span>
          </div>
        </div>
      </div>

      {/* Executive Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Cash"
          value={formatCurrency(treasurySummary.totalCash, true)}
          change={12.5}
          changeLabel={t('dashboard.vsLastMonth')}
          icon={<Banknote size={24} className="text-emerald-400" />}
          trend="up"
          delay={0}
          href="/dashboard/treasury"
        />
        <MetricCard
          title="Receivables"
          value={formatCurrency(receivablesSummary.totalOutstanding, true)}
          change={receivablesSummary.overdueRate > 20 ? -receivablesSummary.overdueRate : 5.2}
          changeLabel={`${receivablesSummary.overdueRate.toFixed(0)}% overdue`}
          icon={<ArrowDownRight size={24} className="text-violet-400" />}
          trend={receivablesSummary.overdueRate > 20 ? 'down' : 'up'}
          delay={0.05}
          href="/dashboard/receivables"
        />
        <MetricCard
          title="Liabilities"
          value={formatCurrency(liabilitiesSummary.totalLiabilities, true)}
          change={-3.2}
          changeLabel={`${liabilitiesSummary.utilizationPercent.toFixed(0)}% utilized`}
          icon={<ArrowUpRight size={24} className="text-rose-400" />}
          trend="down"
          delay={0.1}
          href="/dashboard/liabilities"
        />
        <MetricCard
          title="Net Revenue"
          value={formatCurrency(metrics.netIncome)}
          change={18.7}
          changeLabel={t('dashboard.vsLastMonth')}
          icon={<TrendingUp size={24} className="text-primary-400" />}
          trend="up"
          delay={0.15}
          href="/dashboard/reports"
        />
        <MetricCard
          title="Working Capital"
          value={formatCurrency(workingCapital, true)}
          change={workingCapital > 0 ? 8.3 : -5.1}
          changeLabel="Current period"
          icon={<Activity size={24} className="text-cyan-400" />}
          trend={workingCapital > 0 ? 'up' : 'down'}
          delay={0.2}
          href="/dashboard/kpi"
        />
        <MetricCard
          title={t('wallet.totalValue')}
          value={formatCurrency(totalCryptoValue)}
          change={5.4}
          changeLabel="24h"
          icon={<WalletIcon size={24} className="text-blue-400" />}
          trend="up"
          delay={0.25}
          href="/dashboard/wallet"
        />
      </div>

      {/* Cash Flow | Expense Breakdown (2:1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <ExpenseBreakdownChart />
      </div>

      {/* Transactions | AI Insights (1:1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions />
        <AIInsights />
      </div>

      {/* KPI | Actions (2:1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <KPIPerformance />
        </div>
        <QuickActions />
      </div>

      {/* Financial Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TreasuryOverview />
        <ReceivablesOverview />
        <LiabilitiesSummary />
      </div>

      {/* Quick Stats Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        <div className="p-4 rounded-xl bg-gray-100 dark:bg-surface-900/40 border border-gray-200 dark:border-surface-800/50">
          <p className="text-xs text-gray-500 dark:text-surface-500 uppercase tracking-wider">
            Gross Margin
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-surface-100 mt-1">
            {formatPercentage(metrics.grossMargin)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-gray-100 dark:bg-surface-900/40 border border-gray-200 dark:border-surface-800/50">
          <p className="text-xs text-gray-500 dark:text-surface-500 uppercase tracking-wider">
            Op. Margin
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-surface-100 mt-1">
            {formatPercentage(metrics.operatingMargin)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-gray-100 dark:bg-surface-900/40 border border-gray-200 dark:border-surface-800/50">
          <p className="text-xs text-gray-500 dark:text-surface-500 uppercase tracking-wider">
            Current Ratio
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-surface-100 mt-1">
            {metrics.currentRatio.toFixed(2)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-gray-100 dark:bg-surface-900/40 border border-gray-200 dark:border-surface-800/50">
          <p className="text-xs text-gray-500 dark:text-surface-500 uppercase tracking-wider">
            Quick Ratio
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-surface-100 mt-1">
            {metrics.quickRatio.toFixed(2)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-gray-100 dark:bg-surface-900/40 border border-gray-200 dark:border-surface-800/50">
          <p className="text-xs text-gray-500 dark:text-surface-500 uppercase tracking-wider">
            DSO
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-surface-100 mt-1">
            {receivablesSummary.dso.toFixed(0)} days
          </p>
        </div>
        <div className="p-4 rounded-xl bg-gray-100 dark:bg-surface-900/40 border border-gray-200 dark:border-surface-800/50">
          <p className="text-xs text-gray-500 dark:text-surface-500 uppercase tracking-wider">
            ROE
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-surface-100 mt-1">
            {formatPercentage(metrics.returnOnEquity)}
          </p>
        </div>
      </motion.div>
    </div>
  )
}
