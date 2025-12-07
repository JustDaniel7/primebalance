'use client'

import { useStore } from '@/index'
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

export default function DashboardPage() {
  const { metrics, cryptoTokens } = useStore()

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
        <h1 className="text-2xl font-bold text-surface-100 font-display">
          Dashboard
        </h1>
        <p className="text-surface-500 mt-1">
          Welcome back! Here&apos;s your financial overview.
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          change={12.5}
          changeLabel="vs last month"
          icon={<TrendUpIcon size={24} className="text-primary-400" />}
          trend="up"
          delay={0}
        />
        <MetricCard
          title="Total Expenses"
          value={formatCurrency(metrics.totalExpenses)}
          change={-3.2}
          changeLabel="vs last month"
          icon={<TransactionsIcon size={24} className="text-red-400" />}
          trend="down"
          delay={0.1}
        />
        <MetricCard
          title="Net Income"
          value={formatCurrency(metrics.netIncome)}
          change={18.7}
          changeLabel="vs last month"
          icon={<AccountsIcon size={24} className="text-accent-400" />}
          trend="up"
          delay={0.2}
        />
        <MetricCard
          title="Crypto Holdings"
          value={formatCurrency(totalCryptoValue)}
          change={5.4}
          changeLabel="24h change"
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
        <div className="p-4 rounded-xl bg-surface-900/40 border border-surface-800/50">
          <p className="text-xs text-surface-500 uppercase tracking-wider">
            Gross Margin
          </p>
          <p className="text-xl font-bold text-surface-100 mt-1">
            {formatPercentage(metrics.grossMargin)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-surface-900/40 border border-surface-800/50">
          <p className="text-xs text-surface-500 uppercase tracking-wider">
            Operating Margin
          </p>
          <p className="text-xl font-bold text-surface-100 mt-1">
            {formatPercentage(metrics.operatingMargin)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-surface-900/40 border border-surface-800/50">
          <p className="text-xs text-surface-500 uppercase tracking-wider">
            Current Ratio
          </p>
          <p className="text-xl font-bold text-surface-100 mt-1">
            {metrics.currentRatio.toFixed(2)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-surface-900/40 border border-surface-800/50">
          <p className="text-xs text-surface-500 uppercase tracking-wider">
            Return on Equity
          </p>
          <p className="text-xl font-bold text-surface-100 mt-1">
            {formatPercentage(metrics.returnOnEquity)}
          </p>
        </div>
      </div>
    </div>
  )
}
