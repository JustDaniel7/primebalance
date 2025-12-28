'use client'

import { useStore } from '@/store'
import { useThemeStore } from '@/store/theme-store'
import {
  MetricCard,
  RevenueChart,
  ExpenseBreakdownChart,
  RecentTransactions,
  AIInsights,
} from '@/components/dashboard'
import {
  TrendUpIcon,
  WalletIcon,
  TransactionsIcon,
  AccountsIcon,
} from '@/components/ui/Icons'

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

  // Use default metrics if store metrics is null
  const metrics = storeMetrics ?? defaultMetrics

  const formatCurrency = (value: number) => {
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

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
          {t('dashboard.title')}
        </h1>
        <p className="text-gray-500 dark:text-surface-500 mt-1">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <MetricCard
          title={t('dashboard.totalBalance')}
          value={formatCurrency(metrics.totalRevenue)}
          change={12.5}
          changeLabel={t('dashboard.vsLastMonth')}
          icon={<TrendUpIcon size={24} className="text-primary-400" />}
          trend="up"
          delay={0}
        />
        <MetricCard
          title={t('dashboard.monthlyExpenses')}
          value={formatCurrency(metrics.totalExpenses)}
          change={-3.2}
          changeLabel={t('dashboard.vsLastMonth')}
          icon={<TransactionsIcon size={24} className="text-red-400" />}
          trend="down"
          delay={0.1}
        />
        <MetricCard
          title={t('dashboard.monthlyIncome')}
          value={formatCurrency(metrics.netIncome)}
          change={18.7}
          changeLabel={t('dashboard.vsLastMonth')}
          icon={<AccountsIcon size={24} className="text-accent-400" />}
          trend="up"
          delay={0.2}
        />
        <MetricCard
          title={t('wallet.totalValue')}
          value={formatCurrency(totalCryptoValue)}
          change={5.4}
          changeLabel="24h"
          icon={<WalletIcon size={24} className="text-blue-400" />}
          trend="up"
          delay={0.3}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <ExpenseBreakdownChart />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <RecentTransactions />
        <AIInsights />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gray-100 dark:bg-surface-900/40 border border-gray-200 dark:border-surface-800/50">
          <p className="text-xs text-gray-500 dark:text-surface-500 uppercase tracking-wider">
            {t('common.profit')} %
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-surface-100 mt-1">
            {formatPercentage(metrics.grossMargin)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-gray-100 dark:bg-surface-900/40 border border-gray-200 dark:border-surface-800/50">
          <p className="text-xs text-gray-500 dark:text-surface-500 uppercase tracking-wider">
            {t('common.balance')}
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-surface-100 mt-1">
            {formatPercentage(metrics.operatingMargin)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-gray-100 dark:bg-surface-900/40 border border-gray-200 dark:border-surface-800/50">
          <p className="text-xs text-gray-500 dark:text-surface-500 uppercase tracking-wider">
            {t('common.total')}
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-surface-100 mt-1">
            {metrics.currentRatio.toFixed(2)}
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
      </div>
    </div>
  )
}
