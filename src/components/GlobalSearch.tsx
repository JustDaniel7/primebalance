'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme-store'
import {
  Search,
  X,
  Users,
  FileText,
  Receipt,
  Package,
  Briefcase,
  Building2,
  Archive,
  Wallet,
  Scale,
  BarChart3,
  TrendingUp,
  Boxes,
  ShoppingCart,
  Banknote,
  Command,
} from 'lucide-react'

interface SearchResult {
  id: string
  type: string
  title: string
  subtitle?: string
  description?: string
  url: string
  metadata?: Record<string, unknown>
}

interface SearchResponse {
  results: SearchResult[]
  grouped: Record<string, SearchResult[]>
  total: number
  query: string
}

// Icon mapping for each result type
const typeIcons: Record<string, React.ElementType> = {
  customer: Users,
  supplier: Building2,
  invoice: FileText,
  order: ShoppingCart,
  transaction: Banknote,
  receipt: Receipt,
  project: Briefcase,
  asset: Package,
  liability: Scale,
  archive: Archive,
  account: Wallet,
  netting: TrendingUp,
  treasury: Building2,
  kpi: BarChart3,
  receivable: FileText,
  inventory: Boxes,
}

// Display names for types
const typeLabels: Record<string, string> = {
  customer: 'Customers',
  supplier: 'Suppliers',
  invoice: 'Invoices',
  order: 'Orders',
  transaction: 'Transactions',
  receipt: 'Receipts',
  project: 'Projects',
  asset: 'Assets',
  liability: 'Liabilities',
  archive: 'Archive',
  account: 'Accounts',
  netting: 'Netting',
  treasury: 'Treasury',
  kpi: 'KPIs',
  receivable: 'Receivables',
  inventory: 'Inventory',
}

// Order of type groups in results
const typeOrder = [
  'customer',
  'supplier',
  'invoice',
  'order',
  'transaction',
  'receipt',
  'project',
  'asset',
  'liability',
  'receivable',
  'inventory',
  'account',
  'treasury',
  'netting',
  'kpi',
  'archive',
]

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter()
  const { t } = useThemeStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Get flattened results for keyboard navigation
  const flatResults = results?.results || []

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setQuery('')
      setResults(null)
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Search with debounce
  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults(null)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=50`)
      if (response.ok) {
        const data: SearchResponse = await response.json()
        setResults(data)
        setSelectedIndex(0)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      search(value)
    }, 300)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
      e.preventDefault()
      navigateToResult(flatResults[selectedIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  // Navigate to selected result
  const navigateToResult = (result: SearchResult) => {
    router.push(result.url)
    onClose()
  }

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = document.getElementById(`search-result-${selectedIndex}`)
    selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedIndex])

  // Render grouped results
  const renderGroupedResults = () => {
    if (!results?.grouped) return null

    const sortedTypes = typeOrder.filter((type) => results.grouped[type]?.length > 0)

    return (
      <div className="py-2">
        {sortedTypes.map((type) => {
          const items = results.grouped[type]
          const Icon = typeIcons[type] || FileText
          const startIndex = flatResults.findIndex((r) => r.type === type)

          return (
            <div key={type} className="mb-2">
              <div className="px-4 py-2 flex items-center gap-2">
                <Icon size={14} className="text-gray-400 dark:text-surface-500" />
                <span className="text-xs font-semibold text-gray-500 dark:text-surface-400 uppercase tracking-wider">
                  {typeLabels[type] || type}
                </span>
                <span className="text-xs text-gray-400 dark:text-surface-500">
                  ({items.length})
                </span>
              </div>
              {items.map((item, idx) => {
                const globalIndex = startIndex + idx
                const isSelected = globalIndex === selectedIndex
                const ItemIcon = typeIcons[item.type] || FileText

                return (
                  <button
                    key={item.id}
                    id={`search-result-${globalIndex}`}
                    onClick={() => navigateToResult(item)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left ${
                      isSelected
                        ? 'bg-[var(--accent-primary)]/10 dark:bg-[var(--accent-primary)]/20'
                        : 'hover:bg-gray-50 dark:hover:bg-surface-800/50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-[var(--accent-primary)] text-white'
                          : 'bg-gray-100 dark:bg-surface-800 text-gray-500 dark:text-surface-400'
                      }`}
                    >
                      <ItemIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          isSelected
                            ? 'text-[var(--accent-primary)] dark:text-[var(--accent-primary)]'
                            : 'text-gray-900 dark:text-surface-100'
                        }`}
                      >
                        {item.title}
                      </p>
                      {(item.subtitle || item.description) && (
                        <p className="text-xs text-gray-500 dark:text-surface-400 truncate">
                          {[item.subtitle, item.description].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:text-surface-400 bg-gray-100 dark:bg-surface-800 rounded border border-gray-200 dark:border-surface-700">
                          Enter
                        </kbd>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[15%] left-0 right-0 mx-auto w-full max-w-2xl z-50 px-4"
          >
            <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-surface-700 overflow-hidden">
              {/* Search Input */}
              <div className="relative border-b border-gray-200 dark:border-surface-800">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-surface-500"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t('search.placeholder') || 'Search everything...'}
                  className="w-full pl-12 pr-12 py-4 text-base bg-transparent text-gray-900 dark:text-surface-100 placeholder:text-gray-400 dark:placeholder:text-surface-500 focus:outline-none"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                <button
                  onClick={onClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors"
                >
                  <X size={18} className="text-gray-400 dark:text-surface-500" />
                </button>
              </div>

              {/* Results */}
              <div
                ref={resultsRef}
                className="max-h-[60vh] overflow-y-auto"
              >
                {isLoading && (
                  <div className="px-4 py-8 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-surface-400">Searching...</p>
                  </div>
                )}

                {!isLoading && query.length >= 2 && results?.total === 0 && (
                  <div className="px-4 py-8 text-center">
                    <Search size={40} className="mx-auto text-gray-300 dark:text-surface-600" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-surface-400">
                      No results found for &quot;{query}&quot;
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-surface-500">
                      Try different keywords or check your spelling
                    </p>
                  </div>
                )}

                {!isLoading && query.length < 2 && (
                  <div className="px-4 py-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-surface-800">
                      <Command size={14} className="text-gray-500 dark:text-surface-400" />
                      <span className="text-sm text-gray-600 dark:text-surface-300">K</span>
                      <span className="text-sm text-gray-400 dark:text-surface-500">to open</span>
                    </div>
                    <p className="mt-3 text-sm text-gray-500 dark:text-surface-400">
                      Search across all your data
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-surface-500">
                      Customers, invoices, orders, transactions, and more
                    </p>
                  </div>
                )}

                {!isLoading && results && results.total > 0 && renderGroupedResults()}
              </div>

              {/* Footer */}
              {results && results.total > 0 && (
                <div className="px-4 py-2 border-t border-gray-200 dark:border-surface-800 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-surface-400">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-surface-800 rounded border border-gray-200 dark:border-surface-700">
                        ↑↓
                      </kbd>
                      Navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-surface-800 rounded border border-gray-200 dark:border-surface-700">
                        Enter
                      </kbd>
                      Open
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-surface-800 rounded border border-gray-200 dark:border-surface-700">
                        Esc
                      </kbd>
                      Close
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-surface-500">
                    {results.total} result{results.total !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
