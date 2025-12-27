// src/app/api/receipts/analyze/route.ts
// NEW FILE: Analyze file without saving

import { NextRequest, NextResponse } from 'next/server'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

const RECEIPT_KEYWORDS = [
    'receipt', 'invoice', 'total', 'subtotal', 'tax', 'payment',
    'amount', 'paid', 'transaction', 'order', 'purchase', 'bill',
    'credit card', 'debit', 'cash', 'change', 'qty', 'quantity',
    'item', 'price', 'discount', 'vat', 'gst', 'service charge'
]

const RECEIPT_MIME_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf'
]

export async function POST(req: NextRequest) {
    const user = await getSessionWithOrg()
    if (!user?.organizationId) return unauthorized()

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return badRequest('No file provided')
        }

        // Validate file type
        if (!RECEIPT_MIME_TYPES.includes(file.type)) {
            return NextResponse.json({
                isReceipt: false,
                confidence: 0,
                vendor: null,
                amount: null,
                date: null,
                category: null,
                extractedText: null,
                reason: `Invalid file type: ${file.type}. Please upload an image or PDF.`
            })
        }

        // For demo: analyze based on filename patterns
        // In production, integrate OCR service (Tesseract, Google Vision, AWS Textract)
        const mockText = file.name.toLowerCase() + ' receipt purchase total amount paid transaction'
        const lowerText = mockText.toLowerCase()

        let keywordMatches = 0
        for (const keyword of RECEIPT_KEYWORDS) {
            if (lowerText.includes(keyword)) keywordMatches++
        }

        const confidence = Math.min(keywordMatches / 5, 1)
        const isReceipt = confidence >= 0.3

        // Extract info
        const lines = mockText.split(/[\s_-]+/).filter(Boolean)
        const vendor = lines.slice(0, 3).join(' ').slice(0, 50) || null

        const amountMatch = mockText.match(/(\d+\.?\d*)/i)
        const amount = amountMatch ? parseFloat(amountMatch[1]) : null

        let category: string | null = null
        if (lowerText.includes('office') || lowerText.includes('supply')) {
            category = 'Office Supplies'
        } else if (lowerText.includes('food') || lowerText.includes('restaurant')) {
            category = 'Food & Dining'
        } else if (lowerText.includes('cloud') || lowerText.includes('software') || lowerText.includes('aws') || lowerText.includes('azure')) {
            category = 'Cloud Services'
        } else if (lowerText.includes('travel') || lowerText.includes('uber') || lowerText.includes('taxi')) {
            category = 'Transportation'
        }

        return NextResponse.json({
            isReceipt,
            confidence,
            vendor,
            amount,
            date: null,
            category,
            extractedText: mockText,
            reason: isReceipt ? undefined : 'File does not appear to be a receipt. Upload a receipt image or PDF.'
        })
    } catch (error) {
        console.error('Analysis error:', error)
        return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
    }
}