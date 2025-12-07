'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui'
import { TrendUpIcon, TrendDownIcon } from '@/components/ui/Icons'

interface MetricCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  delay?: number
}

export default function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend = 'neutral',
  delay = 0,
}: MetricCardProps) {
  const trendColors = {
    up: 'text-primary-400',
    down: 'text-red-400',
    neutral: 'text-surface-400',
  }

  const trendBgColors = {
    up: 'bg-primary-500/10',
    down: 'bg-red-500/10',
    neutral: 'bg-surface-500/10',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card variant="glass" hover className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 opacity-50">
          <div
            className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl ${
              trend === 'up'
                ? 'bg-primary-500/10'
                : trend === 'down'
                ? 'bg-red-500/10'
                : 'bg-accent-500/5'
            }`}
          />
        </div>

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${trendBgColors[trend]}`}
            >
              {icon}
            </div>
            {change !== undefined && (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-lg ${trendBgColors[trend]}`}
              >
                {trend === 'up' ? (
                  <TrendUpIcon size={14} className={trendColors[trend]} />
                ) : trend === 'down' ? (
                  <TrendDownIcon size={14} className={trendColors[trend]} />
                ) : null}
                <span className={`text-xs font-medium ${trendColors[trend]}`}>
                  {change > 0 ? '+' : ''}
                  {change}%
                </span>
              </div>
            )}
          </div>

          <p className="text-sm text-surface-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-surface-100 font-display">
            {value}
          </p>
          {changeLabel && (
            <p className="text-xs text-surface-500 mt-1">{changeLabel}</p>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
