'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme-store'
import { useReceiptsStore, Receipt } from '@/store/receipts-store'
import { Card, Button, Badge } from '@/components/ui'
import { PlusIcon, SearchIcon, ReceiptIcon } from '@/components/ui/Icons'
import {
  Upload, Camera, FileText, Check, X, Archive,
  Trash2, RotateCcw, Eye, Loader2, AlertCircle,
  CheckCircle2, XCircle, Clock, Download
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import type { Receipt, ReceiptStatus } from '@/types/receipt'

type ReceiptStatus = 'matched' | 'unmatched' | 'archived'

function getReceiptStatus(receipt: Receipt): ReceiptStatus {
  if (receipt.transactionId) return 'matched'
  return 'unmatched'
}

export default function ReceiptsPage() {
  const { t } = useThemeStore()
  const {
    receipts,
    filter,
    isLoading,
    isUploading,
    isAnalyzing,
    error,
    selectedReceipt,
    inspectorOpen,
    fetchReceipts,
    uploadReceipt,
    analyzeFile,
    deleteReceipt,
    restoreReceipt,
    archiveReceipt,
    setFilter,
    getFilteredReceipts,
    getStats,
    getRestorableReceipts,
    selectReceipt,
    setInspectorOpen,
  } = useReceiptStore()
  const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched' | 'archived'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showDeleted, setShowDeleted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
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

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const processFile = async (file: File) => {
    setUploadError(null)

    // First analyze the file
    const analysis = await analyzeFile(file)

    if (!analysis) {
      setUploadError('Failed to analyze file')
      return
    }

    if (!analysis.isReceipt) {
      setUploadError(analysis.reason || 'This does not appear to be a receipt')
      return
    }

    // If it's a receipt, upload it
    const receipt = await uploadReceipt(file)
    if (!receipt) {
      setUploadError('Failed to upload receipt')
    }
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      await processFile(file)
    }
  }, [analyzeFile, uploadReceipt])

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      await processFile(file)
    }

    // Reset input
    e.target.value = ''
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleCameraClick = () => {
    cameraInputRef.current?.click()
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const stats = getStats()
  const filteredReceipts = getFilteredReceipts()
  const restorableReceipts = getRestorableReceipts()

  const filters: { value: ReceiptStatus | 'all'; label: string }[] = [
    { value: 'all', label: t('receipts.allReceipts') || 'All Receipts' },
    { value: 'unmatched', label: t('receipts.unmatched') || 'Unmatched' },
    { value: 'matched', label: t('receipts.matched') || 'Matched' },
    { value: 'archived', label: t('receipts.archived') || 'Archived' },
  ]

  const getStatusBadge = (status: ReceiptStatus) => {
    switch (status) {
      case 'matched':
        return <Badge variant="success" size="sm"><Check size={12} className="mr-1" />Matched</Badge>
      case 'unmatched':
        return <Badge variant="warning" size="sm"><Clock size={12} className="mr-1" />Unmatched</Badge>
      case 'pending':
        return <Badge variant="neutral" size="sm"><Clock size={12} className="mr-1" />Pending</Badge>
      case 'archived':
        return <Badge variant="neutral" size="sm"><Archive size={12} className="mr-1" />Archived</Badge>
      case 'deleted':
        return <Badge variant="danger" size="sm"><Trash2 size={12} className="mr-1" />Deleted</Badge>
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>
    }
  }

  return (
      <div className="space-y-6">
        {/* Hidden file inputs */}
        <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileInput}
            className="hidden"
        />
        <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInput}
            className="hidden"
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
              {t('receipts.title') || 'Receipts'}
            </h1>
            <p className="text-gray-500 dark:text-surface-500 mt-1">
              {t('receipts.subtitle') || 'Manage and match your receipts'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
                variant="secondary"
                leftIcon={<Camera size={18} />}
                onClick={handleCameraClick}
                disabled={isUploading || isAnalyzing}
            >
              {t('receipts.scanReceipt') || 'Scan Receipt'}
            </Button>
            <Button
                variant="primary"
                leftIcon={isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                onClick={handleUploadClick}
                disabled={isUploading || isAnalyzing}
            >
              {isUploading ? 'Uploading...' : (t('receipts.uploadReceipt') || 'Upload Receipt')}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="glass" padding="md">
            <p className="text-sm text-gray-500 dark:text-surface-500">Total Receipts</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-surface-100">{stats.total}</p>
          </Card>
          <Card variant="glass" padding="md">
            <p className="text-sm text-gray-500 dark:text-surface-500">Matched</p>
            <p className="text-2xl font-bold text-green-600">{stats.matched}</p>
          </Card>
          <Card variant="glass" padding="md">
            <p className="text-sm text-gray-500 dark:text-surface-500">Unmatched</p>
            <p className="text-2xl font-bold text-amber-600">{stats.unmatched}</p>
          </Card>
          <Card variant="glass" padding="md">
            <p className="text-sm text-gray-500 dark:text-surface-500">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-surface-100">{formatCurrency(stats.totalAmount)}</p>
          </Card>
        </div>

        {/* Error Display */}
        {(error || uploadError) && (
            <Card variant="glass" padding="md" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-red-500" size={20} />
                <p className="text-red-700 dark:text-red-400">{error || uploadError}</p>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadError(null)}
                    className="ml-auto"
                >
                  <X size={16} />
                </Button>
              </div>
            </Card>
        )}

        {/* Restorable Receipts Banner */}
        {restorableReceipts.length > 0 && (
            <Card variant="glass" padding="md" className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RotateCcw className="text-amber-500" size={20} />
                  <p className="text-amber-700 dark:text-amber-400">
                    {restorableReceipts.length} receipt(s) can be restored (within 12 hours)
                  </p>
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDeleted(!showDeleted)}
                >
                  {showDeleted ? 'Hide' : 'Show'}
                </Button>
              </div>

              {showDeleted && (
                  <div className="mt-4 space-y-2">
                    {restorableReceipts.map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-2 bg-white dark:bg-surface-800 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-surface-100">{r.vendor || r.fileName}</p>
                            <p className="text-sm text-gray-500">
                              Deleted {r.deletedAt ? formatDistanceToNow(new Date(r.deletedAt), { addSuffix: true }) : ''}
                            </p>
                          </div>
                          <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<RotateCcw size={14} />}
                              onClick={() => restoreReceipt(r.id)}
                          >
                            Restore
                          </Button>
                        </div>
                    ))}
                  </div>
              )}
            </Card>
        )}

        {/* Upload Area */}
        <Card variant="glass" padding="lg">
          <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  dragActive
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                      : 'border-gray-300 dark:border-surface-700 hover:border-[var(--accent-primary)]'
              } ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={handleUploadClick}
          >
            {isAnalyzing ? (
                <>
                  <Loader2 size={48} className="mx-auto text-[var(--accent-primary)] mb-4 animate-spin" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                    Analyzing receipt...
                  </h3>
                </>
            ) : (
                <>
                  <Upload size={48} className="mx-auto text-gray-400 dark:text-surface-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                    {t('receipts.dragDrop') || 'Drag and drop receipts here'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-surface-500 mt-2">
                    {t('receipts.supportedFormats') || 'Supports JPEG, PNG, PDF up to 10MB'}
                  </p>
                </>
            )}
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
                  placeholder="Search receipts..."
                  value={filter.searchQuery || ''}
                  onChange={(e) => setFilter({ searchQuery: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50 text-gray-900 dark:text-surface-100 placeholder:text-gray-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
                <button
                    key={f.value}
                    onClick={() => setFilter({ status: f.value })}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        filter.status === f.value
                            ? 'bg-[var(--accent-primary)] text-white'
                            : 'bg-gray-100 dark:bg-surface-800/50 text-gray-600 dark:text-surface-400 hover:bg-gray-200 dark:hover:bg-surface-700/50'
                    }`}
                >
                  {f.label}
                </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[var(--accent-primary)]" />
            </div>
        )}

        {/* Receipts Grid */}
        {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReceipts.map((receipt, index) => (
                  <motion.div
                      key={receipt.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                  >
                    <Card variant="glass" padding="md" hover className="relative group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-surface-800/50 flex items-center justify-center overflow-hidden">
                          {receipt.fileUrl?.startsWith('data:image') ? (
                              <img
                                  src={receipt.fileUrl}
                                  alt={receipt.fileName}
                                  className="w-full h-full object-cover"
                              />
                          ) : (
                              <FileText size={24} className="text-[var(--accent-primary)]" />
                          )}
                        </div>
                        {getStatusBadge(receipt.status)}
                      </div>

                      <h3 className="font-semibold text-gray-900 dark:text-surface-100 truncate">
                        {receipt.vendor || receipt.fileName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-surface-500">
                        {receipt.category || 'Uncategorized'}
                      </p>

                      {receipt.confidence !== null && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                              <div
                                  className="h-full bg-[var(--accent-primary)] rounded-full"
                                  style={{ width: `${receipt.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{Math.round(receipt.confidence * 100)}%</span>
                          </div>
                      )}

                      <div className="flex items-end justify-between mt-4">
                        <div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-surface-100">
                            {formatCurrency(receipt.amount)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-surface-500">
                            {receipt.date ? format(new Date(receipt.date), 'MMM d, yyyy') : 'No date'}
                          </p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                selectReceipt(receipt)
                                setInspectorOpen(true)
                              }}
                          >
                            <Eye size={16} />
                          </Button>
                          {receipt.status !== 'archived' && (
                              <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => archiveReceipt(receipt.id)}
                              >
                                <Archive size={16} />
                              </Button>
                          )}
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteReceipt(receipt.id)}
                              className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
              ))}
            </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredReceipts.length === 0 && (
            <Card variant="glass" padding="lg" className="text-center">
              <FileText size={48} className="mx-auto text-gray-400 dark:text-surface-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                No receipts found
              </h3>
              <p className="text-gray-500 dark:text-surface-500 mt-2">
                Upload receipts to get started
              </p>
            </Card>
        )}

        {/* Inspector Modal */}
        <AnimatePresence>
          {inspectorOpen && selectedReceipt && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  onClick={() => setInspectorOpen(false)}
              >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white dark:bg-surface-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-surface-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-surface-100">
                      Receipt Details
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setInspectorOpen(false)}>
                      <X size={20} />
                    </Button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Image Preview */}
                      <div className="aspect-[3/4] rounded-xl bg-gray-100 dark:bg-surface-800 overflow-hidden">
                        {selectedReceipt.fileUrl?.startsWith('data:image') ? (
                            <img
                                src={selectedReceipt.fileUrl}
                                alt={selectedReceipt.fileName}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText size={64} className="text-gray-400" />
                            </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-500 dark:text-surface-500">Status</label>
                          <div className="mt-1">{getStatusBadge(selectedReceipt.status)}</div>
                        </div>

                        <div>
                          <label className="text-sm text-gray-500 dark:text-surface-500">Vendor</label>
                          <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                            {selectedReceipt.vendor || '-'}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm text-gray-500 dark:text-surface-500">Amount</label>
                          <p className="text-2xl font-bold text-gray-900 dark:text-surface-100">
                            {formatCurrency(selectedReceipt.amount)}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm text-gray-500 dark:text-surface-500">Date</label>
                          <p className="text-gray-900 dark:text-surface-100">
                            {selectedReceipt.date ? format(new Date(selectedReceipt.date), 'MMMM d, yyyy') : '-'}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm text-gray-500 dark:text-surface-500">Category</label>
                          <p className="text-gray-900 dark:text-surface-100">
                            {selectedReceipt.category || 'Uncategorized'}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm text-gray-500 dark:text-surface-500">Confidence</label>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                              <div
                                  className="h-full bg-[var(--accent-primary)] rounded-full"
                                  style={{ width: `${(selectedReceipt.confidence || 0) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                          {Math.round((selectedReceipt.confidence || 0) * 100)}%
                        </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm text-gray-500 dark:text-surface-500">File</label>
                          <p className="text-gray-900 dark:text-surface-100 text-sm truncate">
                            {selectedReceipt.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(selectedReceipt.fileSize / 1024).toFixed(1)} KB • {selectedReceipt.fileType}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm text-gray-500 dark:text-surface-500">Created</label>
                          <p className="text-gray-900 dark:text-surface-100 text-sm">
                            {format(new Date(selectedReceipt.createdAt), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-surface-700">
                    <div className="flex gap-2">
                      {selectedReceipt.status === 'unmatched' && (
                          <Button variant="primary" size="sm">
                            Match Transaction
                          </Button>
                      )}
                      {selectedReceipt.status !== 'archived' && (
                          <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<Archive size={16} />}
                              onClick={() => {
                                archiveReceipt(selectedReceipt.id)
                                setInspectorOpen(false)
                              }}
                          >
                            Archive
                          </Button>
                      )}
                    </div>
                    <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 size={16} />}
                        onClick={() => {
                          deleteReceipt(selectedReceipt.id)
                          setInspectorOpen(false)
                        }}
                    >
                      Delete
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
  )
}