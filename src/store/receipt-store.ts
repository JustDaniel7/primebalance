// src/store/receipt-store.ts
// Receipt Store - API connected
// NEW FILE

import { create } from 'zustand'
import type { Receipt, ReceiptFilter, ReceiptStats, ReceiptAnalysisResult, ReceiptStatus } from '@/types/receipt'

interface ReceiptState {
    receipts: Receipt[]
    filter: ReceiptFilter
    isLoading: boolean
    isUploading: boolean
    isAnalyzing: boolean
    error: string | null
    selectedReceipt: Receipt | null
    inspectorOpen: boolean

    // API Actions
    fetchReceipts: () => Promise<void>
    uploadReceipt: (file: File) => Promise<Receipt | null>
    analyzeFile: (file: File) => Promise<ReceiptAnalysisResult | null>
    updateReceipt: (id: string, updates: Partial<Receipt>) => Promise<Receipt | null>
    deleteReceipt: (id: string) => Promise<boolean>
    restoreReceipt: (id: string) => Promise<boolean>
    permanentDelete: (id: string) => Promise<boolean>
    matchToTransaction: (receiptId: string, transactionId: string) => Promise<boolean>
    archiveReceipt: (id: string) => Promise<boolean>

    // Filter & Selection
    setFilter: (filter: Partial<ReceiptFilter>) => void
    resetFilter: () => void
    getFilteredReceipts: () => Receipt[]
    selectReceipt: (receipt: Receipt | null) => void
    setInspectorOpen: (open: boolean) => void

    // Stats
    getStats: () => ReceiptStats
    getRestorableReceipts: () => Receipt[]
}

const initialFilter: ReceiptFilter = {
    status: 'all',
    searchQuery: '',
    dateFrom: undefined,
    dateTo: undefined,
    category: undefined,
}

function mapApiToReceipt(api: Record<string, unknown>): Receipt {
    return {
        id: api.id as string,
        fileName: api.fileName as string,
        fileUrl: api.fileUrl as string,
        fileType: api.fileType as string,
        fileSize: (api.fileSize as number) || 0,
        vendor: api.vendor as string | null,
        amount: api.amount as number | null,
        date: api.date ? (api.date as string).split('T')[0] : null,
        extractedText: api.extractedText as string | null,
        confidence: api.confidence as number | null,
        category: api.category as string | null,
        status: (api.status as ReceiptStatus) || 'pending',
        deletedAt: api.deletedAt as string | null,
        transactionId: api.transactionId as string | null,
        organizationId: api.organizationId as string,
        createdAt: api.createdAt as string,
        updatedAt: api.updatedAt as string,
    }
}

export const useReceiptStore = create<ReceiptState>((set, get) => ({
    receipts: [],
    filter: initialFilter,
    isLoading: false,
    isUploading: false,
    isAnalyzing: false,
    error: null,
    selectedReceipt: null,
    inspectorOpen: false,

    fetchReceipts: async () => {
        set({ isLoading: true, error: null })
        try {
            const res = await fetch('/api/receipts')
            if (!res.ok) throw new Error('Failed to fetch receipts')
            const data = await res.json()
            set({ receipts: data.map(mapApiToReceipt), isLoading: false })
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false })
        }
    },

    analyzeFile: async (file: File) => {
        set({ isAnalyzing: true, error: null })
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/receipts/analyze', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Analysis failed')
            }

            const result = await res.json()
            set({ isAnalyzing: false })
            return result as ReceiptAnalysisResult
        } catch (error) {
            set({ error: (error as Error).message, isAnalyzing: false })
            return null
        }
    },

    uploadReceipt: async (file: File) => {
        set({ isUploading: true, error: null })
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/receipts/upload', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Upload failed')
            }

            const receipt = await res.json()
            const mapped = mapApiToReceipt(receipt)
            set((state) => ({
                receipts: [mapped, ...state.receipts],
                isUploading: false,
            }))
            return mapped
        } catch (error) {
            set({ error: (error as Error).message, isUploading: false })
            return null
        }
    },

    updateReceipt: async (id, updates) => {
        try {
            const res = await fetch(`/api/receipts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            })
            if (!res.ok) throw new Error('Failed to update receipt')
            const receipt = await res.json()
            const mapped = mapApiToReceipt(receipt)
            set((state) => ({
                receipts: state.receipts.map((r) => (r.id === id ? mapped : r)),
                selectedReceipt: state.selectedReceipt?.id === id ? mapped : state.selectedReceipt,
            }))
            return mapped
        } catch (error) {
            set({ error: (error as Error).message })
            return null
        }
    },

    deleteReceipt: async (id) => {
        try {
            const res = await fetch(`/api/receipts/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete receipt')
            const receipt = await res.json()
            const mapped = mapApiToReceipt(receipt)
            set((state) => ({
                receipts: state.receipts.map((r) => (r.id === id ? mapped : r)),
                selectedReceipt: null,
                inspectorOpen: false,
            }))
            return true
        } catch (error) {
            set({ error: (error as Error).message })
            return false
        }
    },

    restoreReceipt: async (id) => {
        try {
            const res = await fetch(`/api/receipts/${id}/restore`, { method: 'POST' })
            if (!res.ok) throw new Error('Failed to restore receipt')
            const receipt = await res.json()
            const mapped = mapApiToReceipt(receipt)
            set((state) => ({
                receipts: state.receipts.map((r) => (r.id === id ? mapped : r)),
            }))
            return true
        } catch (error) {
            set({ error: (error as Error).message })
            return false
        }
    },

    permanentDelete: async (id) => {
        try {
            const res = await fetch(`/api/receipts/${id}/permanent`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to permanently delete receipt')
            set((state) => ({
                receipts: state.receipts.filter((r) => r.id !== id),
                selectedReceipt: null,
                inspectorOpen: false,
            }))
            return true
        } catch (error) {
            set({ error: (error as Error).message })
            return false
        }
    },

    matchToTransaction: async (receiptId, transactionId) => {
        return !!(await get().updateReceipt(receiptId, {
            transactionId,
            status: 'matched' as ReceiptStatus
        }))
    },

    archiveReceipt: async (id) => {
        return !!(await get().updateReceipt(id, { status: 'archived' as ReceiptStatus }))
    },

    setFilter: (filter) => {
        set((state) => ({ filter: { ...state.filter, ...filter } }))
    },

    resetFilter: () => set({ filter: initialFilter }),

    getFilteredReceipts: () => {
        const { receipts, filter } = get()
        return receipts.filter((r) => {
            // Exclude deleted unless explicitly viewing deleted
            if (r.status === 'deleted' && filter.status !== 'deleted') return false

            if (filter.status && filter.status !== 'all' && r.status !== filter.status) return false

            if (filter.searchQuery) {
                const q = filter.searchQuery.toLowerCase()
                const matchesVendor = r.vendor?.toLowerCase().includes(q)
                const matchesFile = r.fileName.toLowerCase().includes(q)
                const matchesCategory = r.category?.toLowerCase().includes(q)
                if (!matchesVendor && !matchesFile && !matchesCategory) return false
            }

            if (filter.category && r.category !== filter.category) return false

            return true
        })
    },

    selectReceipt: (receipt) => set({ selectedReceipt: receipt }),

    setInspectorOpen: (open) => set({ inspectorOpen: open }),

    getStats: () => {
        const receipts = get().receipts.filter((r) => r.status !== 'deleted')
        return {
            total: receipts.length,
            matched: receipts.filter((r) => r.status === 'matched').length,
            unmatched: receipts.filter((r) => r.status === 'unmatched' || r.status === 'pending').length,
            archived: receipts.filter((r) => r.status === 'archived').length,
            totalAmount: receipts.reduce((sum, r) => sum + (r.amount || 0), 0),
        }
    },

    getRestorableReceipts: () => {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        return get().receipts.filter(
            (r) => r.status === 'deleted' && r.deletedAt && r.deletedAt > twelveHoursAgo
        )
    },
}))