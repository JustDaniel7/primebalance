// src/types/receipt.ts
// Receipt module types
// NEW FILE

export type ReceiptStatus = 'pending' | 'matched' | 'unmatched' | 'archived' | 'deleted'

export interface Receipt {
    id: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number

    // OCR/AI extracted data
    vendor: string | null
    amount: number | null
    date: string | null
    extractedText: string | null
    confidence: number | null
    category: string | null

    // Status
    status: ReceiptStatus

    // Soft delete
    deletedAt: string | null

    // Relations
    transactionId: string | null
    organizationId: string

    createdAt: string
    updatedAt: string
}

export interface ReceiptAnalysisResult {
    isReceipt: boolean
    confidence: number
    vendor: string | null
    amount: number | null
    date: string | null
    category: string | null
    extractedText: string | null
    reason?: string
}

export interface ReceiptFilter {
    status?: ReceiptStatus | 'all'
    searchQuery?: string
    dateFrom?: string
    dateTo?: string
    category?: string
}

export interface ReceiptStats {
    total: number
    matched: number
    unmatched: number
    archived: number
    totalAmount: number
}