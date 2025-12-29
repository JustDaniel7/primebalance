'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { useThemeStore } from '@/store/theme-store'
import { Card, Button, Badge } from '@/components/ui'
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  Receipt,
  Plus,
  Eye,
  Archive,
  Loader2,
  X,
  RefreshCw,
  ChevronRight,
  Clock,
  Users,
  Package,
  Building2,
  Wallet
} from 'lucide-react'
import { ReportsWizard } from '@/components/reports/ReportsWizard'
import { format } from 'date-fns'

interface SavedReport {
  id: string
  name: string
  type: string
  description?: string
  status: string
  isScheduled: boolean
  scheduleFreq?: string
  lastGenerated?: string
  createdAt: string
  parameters?: { period?: string }
}

interface GeneratedReport {
  reportType: string
  period: string
  generatedAt: string
  data: {
    headers: string[]
    rows: any[]
    totals: Record<string, number>
    summary: Record<string, number>
    currency: string
  }
}

const reportTypes = [
  { id: 'profit-loss', icon: TrendingUp, color: 'emerald', type: 'profit_loss' },
  { id: 'balance-sheet', icon: BarChart3, color: 'blue', type: 'balance_sheet' },
  { id: 'cash-flow', icon: DollarSign, color: 'violet', type: 'cash_flow' },
  { id: 'tax-summary', icon: Receipt, color: 'amber', type: 'tax_summary' },
  { id: 'expense-report', icon: PieChart, color: 'rose', type: 'expense_report' },
  { id: 'income-report', icon: TrendingUp, color: 'cyan', type: 'income_report' },
  { id: 'ar-aging', icon: Users, color: 'orange', type: 'ar_aging' },
  { id: 'ap-aging', icon: Building2, color: 'indigo', type: 'ap_aging' },
  { id: 'inventory-valuation', icon: Package, color: 'teal', type: 'inventory_valuation' },
  { id: 'asset-register', icon: Wallet, color: 'purple', type: 'asset_register' },
]

export default function ReportsPage() {
  const { t } = useThemeStore()
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [showWizard, setShowWizard] = useState(false)
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [viewingReport, setViewingReport] = useState<GeneratedReport | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const periods = [
    { value: 'week', label: t('common.thisWeek') || 'This Week' },
    { value: 'month', label: t('common.thisMonth') || 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: t('common.thisYear') || 'This Year' },
    { value: 'ytd', label: 'YTD' },
  ]

  const fetchSavedReports = useCallback(async () => {
    try {
      const res = await fetch('/api/reports')
      if (res.ok) {
        const data = await res.json()
        setSavedReports(data.reports || [])
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSavedReports()
  }, [fetchSavedReports])

  const generateReport = async (reportType: string) => {
    setIsGenerating(reportType)
    setError(null)
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType, period: selectedPeriod }),
      })

      if (!res.ok) {
        throw new Error('Failed to generate report')
      }

      const data = await res.json()
      setViewingReport(data)
      setViewModalOpen(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsGenerating(null)
    }
  }

  const downloadReport = async (reportData: any, format: 'csv' | 'json' | 'xml' = 'csv') => {
    try {
      const res = await fetch('/api/reports/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData: reportData.data,
          format,
          fileName: `${reportData.reportType}_${reportData.period}_${format}`,
        }),
      })

      if (!res.ok) throw new Error('Download failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportData.reportType}_${reportData.period}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to download report')
    }
  }

  const archiveReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User requested archive' }),
      })

      if (res.ok) {
        setSavedReports(prev => prev.filter(r => r.id !== reportId))
      }
    } catch (err) {
      setError('Failed to archive report')
    }
  }

  const getReportName = (id: string) => {
    switch (id) {
      case 'profit-loss': return t('reports.profitLoss') || 'Profit & Loss'
      case 'balance-sheet': return t('reports.balanceSheet') || 'Balance Sheet'
      case 'cash-flow': return t('reports.cashFlow') || 'Cash Flow'
      case 'tax-summary': return t('reports.taxSummary') || 'Tax Summary'
      case 'expense-report': return t('reports.expenseReport') || 'Expense Report'
      case 'income-report': return t('reports.incomeReport') || 'Income Report'
      case 'ar-aging': return 'AR Aging'
      case 'ap-aging': return 'AP Aging'
      case 'inventory-valuation': return 'Inventory Valuation'
      case 'asset-register': return 'Asset Register'
      default: return id
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Normalize saved report type to API format (e.g., "BALANCE SHEET" -> "balance_sheet")
  const normalizeReportType = (type: string) => {
    return type.toLowerCase().replace(/\s+/g, '_')
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
              {t('reports.title') || 'Reports'}
            </h1>
            <p className="text-gray-500 dark:text-surface-500 mt-1">
              {t('reports.subtitle') || 'Generate and manage financial reports'}
            </p>
          </div>
          <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setShowWizard(true)}>
            {t('reports.newReport') || 'New Report'}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
            <Card variant="glass" padding="md" className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center justify-between">
                <p className="text-red-700 dark:text-red-400">{error}</p>
                <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                  <X size={16} />
                </Button>
              </div>
            </Card>
        )}

        {/* Period Selection */}
        <Card variant="glass" padding="md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-gray-500 dark:text-surface-400" />
              <span className="text-gray-700 dark:text-surface-300 font-medium">
              {t('reports.dateRange') || 'Date Range'}:
            </span>
            </div>
            <div className="flex gap-2 flex-wrap">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {reportTypes.map((report, index) => {
            const Icon = report.icon
            const isLoading = isGenerating === report.type
            return (
                <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                  <Card variant="glass" padding="md" hover className="cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-${report.color}-500/10 flex items-center justify-center`}>
                        <Icon size={24} className={`text-${report.color}-500`} />
                      </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-surface-100 text-sm">
                      {getReportName(report.id)}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-surface-500 mt-1">
                      {periods.find(p => p.value === selectedPeriod)?.label}
                    </p>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-surface-800/50">
                      <button
                          onClick={() => generateReport(normalizeReportType(report.type))}
                          disabled={isLoading}
                          className="flex-1 py-2 text-sm font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                        {t('common.view') || 'View'}
                      </button>
                      <button
                          onClick={async () => {
                            const res = await fetch('/api/reports/generate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ reportType: report.type, period: selectedPeriod }),
                            })
                            if (res.ok) {
                              const data = await res.json()
                              downloadReport(data, 'csv')
                            }
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors"
                      >
                        <Download size={16} className="text-gray-500 dark:text-surface-400" />
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
              {t('reports.savedReports') || 'Saved Reports'}
            </h3>
            <Button
                variant="ghost"
                size="sm"
                leftIcon={<RefreshCw size={14} />}
                onClick={fetchSavedReports}
            >
              Refresh
            </Button>
          </div>

          {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-[var(--accent-primary)]" />
              </div>
          ) : savedReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p>No saved reports yet</p>
              </div>
          ) : (
              <div className="space-y-3">
                {savedReports.map((report) => (
                    <div
                        key={report.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-800/30 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                          <FileText size={20} className="text-[var(--accent-primary)]" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-surface-100">{report.name}</p>
                          <p className="text-sm text-gray-500 dark:text-surface-500">
                            {report.type.replace(/_/g, ' ')}
                            {report.isScheduled && (
                                <Badge variant="info" size="sm" className="ml-2">
                                  <Clock size={10} className="mr-1" />
                                  {report.scheduleFreq}
                                </Badge>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 dark:text-surface-500">
                    {format(new Date(report.createdAt), 'MMM d, yyyy')}
                  </span>
                        <div className="flex gap-2">
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generateReport(normalizeReportType(report.type))}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Download size={14} />}
                              onClick={async () => {
                                const res = await fetch('/api/reports/generate', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    reportType: normalizeReportType(report.type),
                                    period: report.parameters?.period || selectedPeriod,
                                  }),
                                })
                                if (res.ok) {
                                  const data = await res.json()
                                  downloadReport(data, 'csv')
                                }
                              }}
                            >
                              {t('common.download') || 'Download'}
                            </Button>
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => archiveReport(report.id)}
                              className="text-amber-500 hover:text-amber-600"
                          >
                            <Archive size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
          )}
        </Card>

        {/* View Report Modal */}
        <AnimatePresence>
          {viewModalOpen && viewingReport && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  onClick={() => setViewModalOpen(false)}
              >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white dark:bg-surface-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-surface-700">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-surface-100">
                        {getReportName(viewingReport.reportType.replace(/_/g, '-'))}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {periods.find(p => p.value === viewingReport.period)?.label} •
                        Generated {format(new Date(viewingReport.generatedAt), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Download size={14} />}
                          onClick={() => downloadReport(viewingReport, 'csv')}
                      >
                        CSV
                      </Button>
                      <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => downloadReport(viewingReport, 'json')}
                      >
                        JSON
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setViewModalOpen(false)}>
                        <X size={20} />
                      </Button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Summary Cards */}
                    {viewingReport.data.summary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          {Object.entries(viewingReport.data.summary).slice(0, 4).map(([key, value]) => (
                              <Card key={key} variant="glass" padding="md">
                                <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-surface-100">
                                  {typeof value === 'number' && key.toLowerCase().includes('amount')
                                      ? formatCurrency(value)
                                      : typeof value === 'number'
                                          ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                                          : value}
                                </p>
                              </Card>
                          ))}
                        </div>
                    )}

                    {/* Data Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                        <tr className="border-b border-gray-200 dark:border-surface-700">
                          {viewingReport.data.headers.map((header) => (
                              <th
                                  key={header}
                                  className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-surface-400"
                              >
                                {header}
                              </th>
                          ))}
                        </tr>
                        </thead>
                        <tbody>
                        {viewingReport.data.rows.map((row, i) => (
                            <tr
                                key={row.id || i}
                                className="border-b border-gray-100 dark:border-surface-800 hover:bg-gray-50 dark:hover:bg-surface-800/50"
                            >
                              {viewingReport.data.headers.map((header) => {
                                const key = header.toLowerCase().replace(/\s+/g, '_')
                                const altKey = header.toLowerCase().replace(/\s+/g, '')
                                const value = row[key] ?? row[altKey] ?? row[header] ?? '-'

                                return (
                                    <td key={header} className="px-4 py-3 text-sm text-gray-900 dark:text-surface-100">
                                      {typeof value === 'number' && (header.toLowerCase().includes('amount') || header.toLowerCase().includes('value') || header.toLowerCase().includes('cost'))
                                          ? formatCurrency(value)
                                          : typeof value === 'number'
                                              ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                                              : value}
                                    </td>
                                )
                              })}
                            </tr>
                        ))}
                        </tbody>
                        {viewingReport.data.totals && (
                            <tfoot>
                            <tr className="bg-gray-50 dark:bg-surface-800 font-medium">
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-surface-100">
                                Total
                              </td>
                              {viewingReport.data.headers.slice(1).map((header) => {
                                const key = header.toLowerCase().replace(/\s+/g, '_')
                                const value = viewingReport.data.totals[key]
                                return (
                                    <td key={header} className="px-4 py-3 text-sm text-gray-900 dark:text-surface-100">
                                      {value !== undefined
                                          ? typeof value === 'number'
                                              ? formatCurrency(value)
                                              : value
                                          : ''}
                                    </td>
                                )
                              })}
                            </tr>
                            </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>

        {/* Reports Wizard Modal */}
        <AnimatePresence>
          {showWizard && <ReportsWizard onClose={() => setShowWizard(false)} />}
        </AnimatePresence>
      </div>
  )
}