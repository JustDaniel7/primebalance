'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useKPIStore } from '@/store/kpi-store'
import { useThemeStore } from '@/store/theme-store'
import { Card } from '@/components/ui'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'

export default function KPIPerformance() {
  const { t, accentColor, resolvedTheme } = useThemeStore()
  const {
    kpis,
    alerts,
    fetchKPIs,
    fetchAlerts,
    isInitialized,
    marginMetrics,
    cccMetrics,
  } = useKPIStore()

  useEffect(() => {
    if (!isInitialized) {
      fetchKPIs()
      fetchAlerts()
    }
  }, [isInitialized, fetchKPIs, fetchAlerts])

  // Calculate summary stats from KPIs (KPIStatus: 'on_track' | 'watch' | 'off_track')
  const onTrack = kpis.filter((k) => k.value?.status === 'on_track').length
  const watch = kpis.filter((k) => k.value?.status === 'watch').length
  const offTrack = kpis.filter((k) => k.value?.status === 'off_track').length
  const total = kpis.length

  const formatNumber = (value: number, decimals = 1) => {
    if (Math.abs(value) >= 1000000) {
      return (value / 1000000).toFixed(decimals) + 'M'
    }
    if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(decimals) + 'K'
    }
    return value.toFixed(decimals)
  }

  const formatPercent = (value: number) => {
    return value.toFixed(1) + '%'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
      case 'deteriorating':
        return <TrendingDown className="w-3.5 h-3.5 text-red-400" />
      default:
        return <Minus className="w-3.5 h-3.5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'text-emerald-400'
      case 'watch':
        return 'text-amber-400'
      case 'off_track':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'bg-emerald-500/10 border-emerald-500/20'
      case 'watch':
        return 'bg-amber-500/10 border-amber-500/20'
      case 'off_track':
        return 'bg-red-500/10 border-red-500/20'
      default:
        return 'bg-gray-500/10 border-gray-500/20'
    }
  }

  // Get top KPIs to display
  const pinnedKPIs = kpis.filter((k) => k.isPinned).slice(0, 4)
  const displayKPIs = pinnedKPIs.length > 0
    ? pinnedKPIs
    : kpis.filter((k) => k.value?.status === 'off_track' || k.value?.status === 'watch').slice(0, 4)

  // If no at-risk KPIs, show first few
  const finalKPIs = displayKPIs.length > 0 ? displayKPIs : kpis.slice(0, 4)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="h-full"
    >
      <Card variant="glass" className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                KPI Dashboard
              </h3>
              <p className="text-xs text-gray-500 dark:text-surface-500">
                Key Performance Indicators
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/kpis"
            className="flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:opacity-80 transition-opacity"
          >
            View All
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-emerald-400">{onTrack}</p>
            <p className="text-[10px] text-emerald-400/70">On Track</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-lg font-bold text-amber-400">{watch}</p>
            <p className="text-[10px] text-amber-400/70">Watch</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="w-3.5 h-3.5 text-red-400" />
            </div>
            <p className="text-lg font-bold text-red-400">{offTrack}</p>
            <p className="text-[10px] text-red-400/70">Off Track</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <p className="text-lg font-bold text-blue-400">{total}</p>
            <p className="text-[10px] text-blue-400/70">Total</p>
          </div>
        </div>

        {/* Key Metrics from aggregated data */}
        {(marginMetrics || cccMetrics) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {marginMetrics && (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-surface-400">Gross Margin</span>
                  {getTrendIcon(marginMetrics.grossMargin?.trend || 'stable')}
                </div>
                <p className={`text-xl font-bold ${getStatusColor(marginMetrics.grossMargin?.status || 'on_track')}`}>
                  {formatPercent(marginMetrics.grossMargin?.current || 0)}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-surface-500 mt-1">
                  vs {formatPercent(marginMetrics.grossMargin?.previous || 0)} prior
                </p>
              </div>
            )}
            {cccMetrics && (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-surface-400">DSO</span>
                  {getTrendIcon(cccMetrics.dso?.trend || 'stable')}
                </div>
                <p className={`text-xl font-bold ${getStatusColor(cccMetrics.dso?.status || 'on_track')}`}>
                  {cccMetrics.dso?.current?.toFixed(0) || 0} days
                </p>
                <p className="text-[10px] text-gray-500 dark:text-surface-500 mt-1">
                  Target: {cccMetrics.internalTarget || 30} days
                </p>
              </div>
            )}
          </div>
        )}

        {/* KPI List */}
        {finalKPIs.length > 0 && (
          <div className="space-y-2 mb-6">
            <span className="text-xs font-medium text-gray-500 dark:text-surface-400">
              {pinnedKPIs.length > 0 ? 'Pinned KPIs' : 'Key Metrics'}
            </span>
            {finalKPIs.map((kpi, index) => (
              <motion.div
                key={kpi.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                className={`flex items-center justify-between p-3 rounded-xl border ${getStatusBg(kpi.value?.status || 'on_track')}`}
              >
                <div className="flex items-center gap-3">
                  {getTrendIcon(kpi.value?.trend || 'stable')}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-surface-100">
                      {kpi.definition?.name || kpi.id}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-surface-500">
                      {kpi.definition?.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${getStatusColor(kpi.value?.status || 'on_track')}`}>
                    {kpi.definition?.unit === 'percentage'
                      ? formatPercent(kpi.value?.current || 0)
                      : kpi.definition?.unit === 'currency'
                      ? '$' + formatNumber(kpi.value?.current || 0)
                      : kpi.definition?.unit === 'days'
                      ? `${(kpi.value?.current || 0).toFixed(0)} days`
                      : formatNumber(kpi.value?.current || 0, 1)
                    }
                  </p>
                  {kpi.value?.deltaVsPriorPercent !== undefined && (
                    <p className={`text-[10px] ${
                      kpi.value.deltaVsPriorPercent > 0 ? 'text-emerald-400' :
                      kpi.value.deltaVsPriorPercent < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {kpi.value.deltaVsPriorPercent > 0 ? '+' : ''}
                      {kpi.value.deltaVsPriorPercent.toFixed(1)}%
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-surface-700/50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">
                {alerts.filter((a) => !a.isRead).length} Active Alerts
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-surface-500 line-clamp-2">
              {alerts[0]?.message || 'Review your KPI performance metrics'}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
