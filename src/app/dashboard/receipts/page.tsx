'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme-store'
import { useReceiptsStore, Receipt } from '@/store/receipts-store'
import { Card, Button, Badge } from '@/components/ui'
import { PlusIcon, SearchIcon, ReceiptIcon } from '@/components/ui/Icons'
import { Upload, Camera, FileText, Check, X, Archive } from 'lucide-react'
import { format } from 'date-fns'

type ReceiptStatus = 'matched' | 'unmatched' | 'archived'

function getReceiptStatus(receipt: Receipt): ReceiptStatus {
  if (receipt.transactionId) return 'matched'
  return 'unmatched'
}

export default function ReceiptsPage() {
  const { t } = useThemeStore()
  const { receipts, fetchReceipts, isLoading } = useReceiptsStore()
  const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched' | 'archived'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch receipts on mount
  useEffect(() => {
    fetchReceipts()
  }, [fetchReceipts])

  const filteredReceipts = useMemo(() => {
    return receipts.filter((receipt) => {
      const status = getReceiptStatus(receipt)
      const matchesFilter = filter === 'all' || status === filter
      const matchesSearch = (receipt.vendor || receipt.fileName || '').toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [receipts, filter, searchQuery])

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
        {isLoading ? (
          <div className="col-span-3 text-center py-8 text-gray-500 dark:text-surface-500">
            {t('common.loading')}...
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-gray-500 dark:text-surface-500">
            {t('receipts.noReceipts') || 'No receipts found'}
          </div>
        ) : (
          filteredReceipts.map((receipt, index) => {
            const status = getReceiptStatus(receipt)
            return (
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
                        status === 'matched' ? 'success' :
                        status === 'unmatched' ? 'warning' : 'neutral'
                      }
                      size="sm"
                    >
                      {status === 'matched' ? t('receipts.matched') :
                       status === 'unmatched' ? t('receipts.unmatched') :
                       t('receipts.archived')}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-gray-900 dark:text-surface-100">
                    {receipt.vendor || receipt.fileName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-surface-500">{receipt.fileType}</p>

                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-surface-100">
                        {receipt.amount ? formatCurrency(receipt.amount) : '-'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-surface-500">
                        {receipt.date ? format(new Date(receipt.date), 'MMM d, yyyy') : format(new Date(receipt.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {status === 'unmatched' && (
                        <Button variant="secondary" size="sm">
                          {t('receipts.matchTransaction')}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
