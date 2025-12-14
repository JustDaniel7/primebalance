'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme-store'
import { Card, Button, Badge } from '@/components/ui'
import { PlusIcon, SearchIcon, ReceiptIcon } from '@/components/ui/Icons'
import { Upload, Camera, FileText, Check, X, Archive } from 'lucide-react'
import { format } from 'date-fns'

interface Receipt {
  id: string
  merchant: string
  amount: number
  date: string
  status: 'matched' | 'unmatched' | 'archived'
  category: string
  imageUrl?: string
}

const mockReceipts: Receipt[] = [
  { id: '1', merchant: 'Amazon Web Services', amount: 4500.00, date: '2024-12-01', status: 'matched', category: 'Cloud Services' },
  { id: '2', merchant: 'Office Depot', amount: 234.50, date: '2024-12-02', status: 'unmatched', category: 'Office Supplies' },
  { id: '3', merchant: 'Uber for Business', amount: 89.00, date: '2024-12-03', status: 'matched', category: 'Transportation' },
  { id: '4', merchant: 'Zoom Video', amount: 149.90, date: '2024-12-04', status: 'archived', category: 'Software' },
  { id: '5', merchant: 'Staples', amount: 67.25, date: '2024-12-05', status: 'unmatched', category: 'Office Supplies' },
]

export default function ReceiptsPage() {
  const { t } = useThemeStore()
  const [receipts] = useState<Receipt[]>(mockReceipts)
  const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched' | 'archived'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredReceipts = receipts.filter((receipt) => {
    const matchesFilter = filter === 'all' || receipt.status === filter
    const matchesSearch = receipt.merchant.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const filters = [
    { value: 'all', label: t('receipts.allReceipts') },
    { value: 'unmatched', label: t('receipts.unmatched') },
    { value: 'matched', label: t('receipts.matched') },
    { value: 'archived', label: t('receipts.archived') },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
            {t('receipts.title')}
          </h1>
          <p className="text-gray-500 dark:text-surface-500 mt-1">
            {t('receipts.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" leftIcon={<Camera size={18} />}>
            {t('receipts.scanReceipt')}
          </Button>
          <Button variant="primary" leftIcon={<Upload size={18} />}>
            {t('receipts.uploadReceipt')}
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <Card variant="glass" padding="lg">
        <div className="border-2 border-dashed border-gray-300 dark:border-surface-700 rounded-xl p-8 text-center hover:border-[var(--accent-primary)] transition-colors cursor-pointer">
          <Upload size={48} className="mx-auto text-gray-400 dark:text-surface-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
            {t('receipts.dragDrop')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-surface-500 mt-2">
            {t('receipts.supportedFormats')}
          </p>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <SearchIcon
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-surface-500"
            />
            <input
              type="text"
              placeholder={t('common.search') + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50 text-gray-900 dark:text-surface-100 placeholder:text-gray-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-gray-100 dark:bg-surface-800/50 text-gray-600 dark:text-surface-400 hover:bg-gray-200 dark:hover:bg-surface-700/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Receipts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReceipts.map((receipt, index) => (
          <motion.div
            key={receipt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card variant="glass" padding="md" hover>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-surface-800/50 flex items-center justify-center">
                  <FileText size={24} className="text-[var(--accent-primary)]" />
                </div>
                <Badge
                  variant={
                    receipt.status === 'matched' ? 'success' :
                    receipt.status === 'unmatched' ? 'warning' : 'neutral'
                  }
                  size="sm"
                >
                  {receipt.status === 'matched' ? t('receipts.matched') :
                   receipt.status === 'unmatched' ? t('receipts.unmatched') :
                   t('receipts.archived')}
                </Badge>
              </div>
              
              <h3 className="font-semibold text-gray-900 dark:text-surface-100">{receipt.merchant}</h3>
              <p className="text-sm text-gray-500 dark:text-surface-500">{receipt.category}</p>
              
              <div className="flex items-end justify-between mt-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-surface-100">
                    {formatCurrency(receipt.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-surface-500">
                    {format(new Date(receipt.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {receipt.status === 'unmatched' && (
                    <Button variant="secondary" size="sm">
                      {t('receipts.matchTransaction')}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
