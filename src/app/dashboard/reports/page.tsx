'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState,} from 'react'
import { useThemeStore } from '@/store/theme-store'
import { Card, Button, Badge } from '@/components/ui'
import { ReportsIcon, TrendUpIcon, TrendDownIcon } from '@/components/ui/Icons'
import { 
  FileText, 
  Download, 
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  Receipt,
  Clock,
  Plus
} from 'lucide-react'
import { ReportsWizard } from '@/components/reports/ReportsWizard'

const reportTypes = [
  { id: 'profit-loss', icon: TrendingUp, color: 'emerald' },
  { id: 'balance-sheet', icon: BarChart3, color: 'blue' },
  { id: 'cash-flow', icon: DollarSign, color: 'violet' },
  { id: 'tax-summary', icon: Receipt, color: 'amber' },
  { id: 'expense-report', icon: PieChart, color: 'rose' },
  { id: 'income-report', icon: TrendingUp, color: 'cyan' },
]

export default function ReportsPage() {
  const { t } = useThemeStore()
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [showWizard, setShowWizard] = useState(false)

  const periods = [
    { value: 'week', label: t('common.thisWeek') },
    { value: 'month', label: t('common.thisMonth') },
    { value: 'year', label: t('common.thisYear') },
    { value: 'custom', label: t('common.custom') },
  ]

  const getReportName = (id: string) => {
    switch (id) {
      case 'profit-loss': return t('reports.profitLoss')
      case 'balance-sheet': return t('reports.balanceSheet')
      case 'cash-flow': return t('reports.cashFlow')
      case 'tax-summary': return t('reports.taxSummary')
      case 'expense-report': return t('reports.expenseReport')
      case 'income-report': return t('reports.incomeReport')
      default: return id
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
            {t('reports.title')}
          </h1>
          <p className="text-gray-500 dark:text-surface-500 mt-1">
            {t('reports.subtitle')}
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setShowWizard(true)}>
          {t('reports.newReport') || 'New Report'}
        </Button>
        {/* Reports Wizard Modal */}
        <AnimatePresence>
          {showWizard && <ReportsWizard onClose={() => setShowWizard(false)} />}
        </AnimatePresence>
      </div>
      )
      &rbrace;

      {/* Period Selection */}
      <Card variant="glass" padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-500 dark:text-surface-400" />
            <span className="text-gray-700 dark:text-surface-300 font-medium">{t('reports.dateRange')}:</span>
          </div>
          <div className="flex gap-2">
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedPeriod === period.value
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-gray-100 dark:bg-surface-800/50 text-gray-600 dark:text-surface-400 hover:bg-gray-200 dark:hover:bg-surface-700/50'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report, index) => {
          const Icon = report.icon
          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card variant="glass" padding="md" hover className="cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-${report.color}-500/10 flex items-center justify-center`}>
                    <Icon size={24} className={`text-${report.color}-500`} />
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors">
                      <Download size={16} className="text-gray-500 dark:text-surface-400" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-surface-100">
                  {getReportName(report.id)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-surface-500 mt-1">
                  {t('common.thisMonth')}
                </p>
                
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-surface-800/50">
                  <button className="flex-1 py-2 text-sm font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-colors">
                    {t('common.view')}
                  </button>
                  <button className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-surface-400 hover:bg-gray-100 dark:hover:bg-surface-800/50 rounded-lg transition-colors">
                    {t('reports.exportPDF')}
                  </button>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Saved Reports */}
      <Card variant="glass" padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
            {t('reports.savedReports')}
          </h3>
          <Button variant="secondary" size="sm">
            {t('common.viewAll')}
          </Button>
        </div>
        
        <div className="space-y-3">
          {[
            { name: 'Q4 2024 Financial Summary', date: 'Dec 1, 2024', type: t('reports.profitLoss') },
            { name: 'November Expense Report', date: 'Nov 30, 2024', type: t('reports.expenseReport') },
            { name: 'Tax Preparation 2024', date: 'Nov 15, 2024', type: t('reports.taxSummary') },
          ].map((report, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-800/30 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                  <FileText size={20} className="text-[var(--accent-primary)]" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-surface-100">{report.name}</p>
                  <p className="text-sm text-gray-500 dark:text-surface-500">{report.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 dark:text-surface-500">{report.date}</span>
                <Button variant="ghost" size="sm" leftIcon={<Download size={14} />}>
                  {t('common.download')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
