// src/app/api/receipts/upload/route.ts
// NEW FILE: Handle file upload with analysis

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// Receipt detection patterns
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

function analyzeReceiptContent(text: string): {
    isReceipt: boolean
    confidence: number
    vendor: string | null
    amount: number | null
    date: string | null
    category: string | null
} {
    const lowerText = text.toLowerCase()

    // Count keyword matches
    let keywordMatches = 0
    for (const keyword of RECEIPT_KEYWORDS) {
        if (lowerText.includes(keyword)) keywordMatches++
    }

    // Calculate confidence based on keyword density
    const confidence = Math.min(keywordMatches / 5, 1) // Max out at 5 keywords
    const isReceipt = confidence >= 0.4 // At least 2 keywords

    // Try to extract vendor (first line often contains it)
    const lines = text.split('\n').filter(l => l.trim())
    const vendor = lines[0]?.trim().slice(0, 100) || null

    // Try to extract amount (look for currency patterns)
    const amountMatch = text.match(/(?:total|amount|paid|sum)[:\s]*[$€£]?\s*([\d,]+\.?\d*)/i)
        || text.match(/[$€£]\s*([\d,]+\.?\d*)/i)
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : null

    // Try to extract date
    const dateMatch = text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/)
        || text.match(/(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/)
    const date = dateMatch ? dateMatch[1] : null

    // Categorize based on keywords
    let category: string | null = null
    if (lowerText.includes('restaurant') || lowerText.includes('food') || lowerText.includes('dining')) {
        category = 'Food & Dining'
    } else if (lowerText.includes('office') || lowerText.includes('supplies') || lowerText.includes('staples')) {
        category = 'Office Supplies'
    } else if (lowerText.includes('software') || lowerText.includes('subscription') || lowerText.includes('cloud')) {
        category = 'Software & Services'
    } else if (lowerText.includes('travel') || lowerText.includes('uber') || lowerText.includes('flight') || lowerText.includes('hotel')) {
        category = 'Travel & Transportation'
    } else if (lowerText.includes('utility') || lowerText.includes('electric') || lowerText.includes('water')) {
        category = 'Utilities'
    }

    return { isReceipt, confidence, vendor, amount, date, category }
}

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
            return badRequest(`Invalid file type: ${file.type}. Supported: images and PDF`)
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return badRequest('File too large. Maximum size is 10MB')
        }

        // Convert file to base64 for storage (in production, use cloud storage)
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')
        const fileUrl = `data:${file.type};base64,${base64}`

        // For images, we'd normally do OCR here
        // For now, use filename-based analysis as placeholder
        const mockText = file.name + ' receipt purchase total amount paid'
        const analysis = analyzeReceiptContent(mockText)

        if (!analysis.isReceipt) {
            return NextResponse.json({
                error: 'File does not appear to be a receipt',
                confidence: analysis.confidence,
                suggestion: 'Please upload an image or PDF of a receipt with visible transaction details'
            }, { status: 422 })
        }

        // Create receipt record
        const receipt = await prisma.receipt.create({
            data: {
                fileName: file.name,
                fileUrl,
                fileType: file.type,
                fileSize: file.size,
                vendor: analysis.vendor,
                amount: analysis.amount,
                date: analysis.date ? new Date(analysis.date) : null,
                category: analysis.category,
                confidence: analysis.confidence,
                extractedText: mockText,
                status: 'unmatched',
                organizationId: user.organizationId,
            }
        })

        return NextResponse.json(receipt, { status: 201 })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}