'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme-store'
import { useReceiptsStore, Receipt } from '@/store/receipts-store'
import { Card, Button, Badge } from '@/components/ui'
import { SearchIcon } from '@/components/ui/Icons'
import {
  Upload, Camera, FileText, Check, X, Archive,
  Trash2, Eye, Loader2, AlertCircle, Clock
} from 'lucide-react'
import { format } from 'date-fns'

type FilterStatus = 'all' | 'linked' | 'unlinked'

export default function ReceiptsPage() {
  const { t } = useThemeStore()
  const {
    receipts,
    isLoading,
    error,
    fetchReceipts,
    uploadReceipt,
    deleteReceipt,
    clearError,
    getUnlinkedReceipts,
    getLinkedReceipts,
  } = useReceiptsStore()

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Fetch receipts on mount
  useEffect(() => {
    fetchReceipts()
  }, [fetchReceipts])

  // Filter receipts based on status and search
  const filteredReceipts = useMemo(() => {
    let filtered = receipts

    if (filterStatus === 'linked') {
      filtered = getLinkedReceipts()
    } else if (filterStatus === 'unlinked') {
      filtered = getUnlinkedReceipts()
    }

    if (searchQuery) {
      filtered = filtered.filter((receipt) =>
        (receipt.vendor || receipt.fileName || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [receipts, filterStatus, searchQuery, getLinkedReceipts, getUnlinkedReceipts])

  // Calculate stats
  const stats = useMemo(() => ({
    total: receipts.length,
    linked: getLinkedReceipts().length,
    unlinked: getUnlinkedReceipts().length,
    totalAmount: receipts.reduce((sum, r) => sum + (r.amount || 0), 0),
  }), [receipts, getLinkedReceipts, getUnlinkedReceipts])

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
    setIsUploading(true)

    try {
      // Create a simple upload data object
      const receipt = await uploadReceipt({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      })

      if (!receipt) {
        setUploadError('Failed to upload receipt')
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload receipt')
    } finally {
      setIsUploading(false)
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
  }, [])

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

  const filters: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: t('receipts.allReceipts') || 'All Receipts' },
    { value: 'unlinked', label: t('receipts.unmatched') || 'Unlinked' },
    { value: 'linked', label: t('receipts.matched') || 'Linked' },
  ]

  const getStatusBadge = (receipt: Receipt) => {
    if (receipt.transactionId) {
      return <Badge variant="success" size="sm"><Check size={12} className="mr-1" />Linked</Badge>
    }
    return <Badge variant="warning" size="sm"><Clock size={12} className="mr-1" />Unlinked</Badge>
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
            disabled={isUploading}
          >
            {t('receipts.scanReceipt') || 'Scan Receipt'}
          </Button>
          <Button
            variant="primary"
            leftIcon={isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            onClick={handleUploadClick}
            disabled={isUploading}
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
          <p className="text-sm text-gray-500 dark:text-surface-500">Linked</p>
          <p className="text-2xl font-bold text-green-600">{stats.linked}</p>
        </Card>
        <Card variant="glass" padding="md">
          <p className="text-sm text-gray-500 dark:text-surface-500">Unlinked</p>
          <p className="text-2xl font-bold text-amber-600">{stats.unlinked}</p>
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
              onClick={() => {
                setUploadError(null)
                clearError()
              }}
              className="ml-auto"
            >
              <X size={16} />
            </Button>
          </div>
        </Card>
      )}

      {/* Upload Area */}
      <Card variant="glass" padding="lg">
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            dragActive
              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
              : 'border-gray-300 dark:border-surface-700 hover:border-[var(--accent-primary)]'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleUploadClick}
        >
          {isUploading ? (
            <>
              <Loader2 size={48} className="mx-auto text-[var(--accent-primary)] mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                Uploading...
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50 text-gray-900 dark:text-surface-100 placeholder:text-gray-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterStatus === f.value
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
                  {getStatusBadge(receipt)}
                </div>

                <h3 className="font-semibold text-gray-900 dark:text-surface-100 truncate">
                  {receipt.vendor || receipt.fileName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-surface-500">
                  {receipt.fileType}
                </p>

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
                        setSelectedReceipt(receipt)
                        setInspectorOpen(true)
                      }}
                    >
                      <Eye size={16} />
                    </Button>
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
                      <div className="mt-1">{getStatusBadge(selectedReceipt)}</div>
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
              <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-surface-700">
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
