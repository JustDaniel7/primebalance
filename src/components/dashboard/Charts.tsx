'use client'

import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme-store'
import { Card } from '@/components/ui'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const revenueData = [
  { month: 'Jan', revenue: 42000, expenses: 28000 },
  { month: 'Feb', revenue: 45000, expenses: 30000 },
  { month: 'Mar', revenue: 51000, expenses: 32000 },
  { month: 'Apr', revenue: 48000, expenses: 35000 },
  { month: 'May', revenue: 55000, expenses: 33000 },
  { month: 'Jun', revenue: 62000, expenses: 38000 },
]

const expenseData = [
  { name: 'Cloud Services', value: 35, color: '#10b981' },
  { name: 'Marketing', value: 25, color: '#3b82f6' },
  { name: 'Operations', value: 20, color: '#8b5cf6' },
  { name: 'Staff', value: 15, color: '#f59e0b' },
  { name: 'Other', value: 5, color: '#6b7280' },
]

export function RevenueChart() {
  const { t, resolvedTheme, accentColor } = useThemeStore()
  
  // Get accent color for chart
  const getAccentColor = () => {
    const colors: Record<string, string> = {
      emerald: '#10b981',
      blue: '#3b82f6',
      violet: '#8b5cf6',
      rose: '#f43f5e',
      amber: '#f59e0b',
      cyan: '#06b6d4',
      orange: '#f97316',
    }
    return colors[accentColor] || '#10b981'
  }

  const primaryColor = getAccentColor()
  const textColor = resolvedTheme === 'dark' ? '#9ca3af' : '#6b7280'
  const gridColor = resolvedTheme === 'dark' ? '#374151' : '#e5e7eb'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card variant="glass">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
            {t('dashboard.cashFlow')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-surface-500">
            {t('common.income')} vs {t('common.expense')}
          </p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" stroke={textColor} fontSize={12} />
              <YAxis stroke={textColor} fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
                  border: `1px solid ${resolvedTheme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  color: resolvedTheme === 'dark' ? '#f3f4f6' : '#1f2937',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={primaryColor}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name={t('common.income')}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#f43f5e"
                fillOpacity={1}
                fill="url(#colorExpenses)"
                name={t('common.expense')}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  )
}

export function ExpenseBreakdownChart() {
  const { t, resolvedTheme } = useThemeStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card variant="glass">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
            {t('dashboard.expenseBreakdown')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-surface-500">
            {t('dashboard.last30Days')}
          </p>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
                  border: `1px solid ${resolvedTheme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  color: resolvedTheme === 'dark' ? '#f3f4f6' : '#1f2937',
                }}
                formatter={(value: number) => [`${value}%`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {expenseData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600 dark:text-surface-400">{item.name}</span>
              <span className="text-xs text-gray-900 dark:text-surface-200 ml-auto font-medium">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}
