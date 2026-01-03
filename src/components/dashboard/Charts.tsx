'use client'

import { useState, useMemo } from 'react'
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

// Extended data for different time ranges
const dailyData = [
  { label: 'Mon', revenue: 8500, expenses: 5200 },
  { label: 'Tue', revenue: 9200, expenses: 5800 },
  { label: 'Wed', revenue: 7800, expenses: 4900 },
  { label: 'Thu', revenue: 10500, expenses: 6100 },
  { label: 'Fri', revenue: 11200, expenses: 6800 },
  { label: 'Sat', revenue: 6500, expenses: 3200 },
  { label: 'Sun', revenue: 4800, expenses: 2100 },
]

const weeklyData = [
  { label: 'W1', revenue: 42000, expenses: 28000 },
  { label: 'W2', revenue: 45000, expenses: 30000 },
  { label: 'W3', revenue: 51000, expenses: 32000 },
  { label: 'W4', revenue: 48000, expenses: 35000 },
]

const monthlyData = [
  { label: 'Jan', revenue: 42000, expenses: 28000 },
  { label: 'Feb', revenue: 45000, expenses: 30000 },
  { label: 'Mar', revenue: 51000, expenses: 32000 },
  { label: 'Apr', revenue: 48000, expenses: 35000 },
  { label: 'May', revenue: 55000, expenses: 33000 },
  { label: 'Jun', revenue: 62000, expenses: 38000 },
  { label: 'Jul', revenue: 58000, expenses: 36000 },
  { label: 'Aug', revenue: 64000, expenses: 39000 },
  { label: 'Sep', revenue: 61000, expenses: 37000 },
  { label: 'Oct', revenue: 68000, expenses: 41000 },
  { label: 'Nov', revenue: 72000, expenses: 44000 },
  { label: 'Dec', revenue: 78000, expenses: 48000 },
]

const yearlyData = [
  { label: '2024', revenue: 680000, expenses: 420000 },
]

const threeYearData = [
  { label: '2022', revenue: 520000, expenses: 340000 },
  { label: '2023', revenue: 610000, expenses: 380000 },
  { label: '2024', revenue: 680000, expenses: 420000 },
]

const fiveYearData = [
  { label: '2020', revenue: 380000, expenses: 260000 },
  { label: '2021', revenue: 450000, expenses: 300000 },
  { label: '2022', revenue: 520000, expenses: 340000 },
  { label: '2023', revenue: 610000, expenses: 380000 },
  { label: '2024', revenue: 680000, expenses: 420000 },
]

type TimeRange = 'd' | 'w' | 'm' | 'y' | '3y' | '5y'

const expenseData = [
  { name: 'Cloud Services', value: 35, color: '#10b981' },
  { name: 'Marketing', value: 25, color: '#3b82f6' },
  { name: 'Operations', value: 20, color: '#8b5cf6' },
  { name: 'Staff', value: 15, color: '#f59e0b' },
  { name: 'Other', value: 5, color: '#6b7280' },
]

export function RevenueChart() {
  const { t, resolvedTheme, accentColor } = useThemeStore()
  const [timeRange, setTimeRange] = useState<TimeRange>('m')

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

  // Get data based on selected time range
  const chartData = useMemo(() => {
    switch (timeRange) {
      case 'd': return dailyData
      case 'w': return weeklyData
      case 'm': return monthlyData
      case 'y': return yearlyData
      case '3y': return threeYearData
      case '5y': return fiveYearData
      default: return monthlyData
    }
  }, [timeRange])

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: 'd', label: 'D' },
    { value: 'w', label: 'W' },
    { value: 'm', label: 'M' },
    { value: 'y', label: 'Y' },
    { value: '3y', label: '3Y' },
    { value: '5y', label: '5Y' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-full"
    >
      <Card variant="glass" className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
              {t('dashboard.cashFlow')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-surface-500">
              {t('common.income')} vs {t('common.expense')}
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-surface-800/50">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  timeRange === option.value
                    ? 'bg-white dark:bg-surface-700 text-gray-900 dark:text-surface-100 shadow-sm'
                    : 'text-gray-500 dark:text-surface-400 hover:text-gray-700 dark:hover:text-surface-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-[256px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
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
              <XAxis dataKey="label" stroke={textColor} fontSize={12} />
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

// Custom tooltip for better readability
const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-gray-900 dark:bg-surface-800 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-700 dark:border-surface-600">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.payload.color }}
          />
          <span className="font-medium">{data.name}</span>
        </div>
        <p className="text-lg font-bold mt-1">{data.value}%</p>
      </div>
    )
  }
  return null
}

export function ExpenseBreakdownChart() {
  const { t } = useThemeStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="h-full"
    >
      <Card variant="glass" className="h-full flex flex-col">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
            {t('dashboard.expenseBreakdown')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-surface-500">
            {t('dashboard.last30Days')}
          </p>
        </div>
        <div className="flex-1 min-h-[192px]">
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
              <Tooltip content={<CustomPieTooltip />} />
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
