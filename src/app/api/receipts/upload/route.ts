// src/app/api/receipts/upload/route.ts
// Handle file upload with AI-powered OCR analysis

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'
import OpenAI from 'openai'

const RECEIPT_MIME_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf'
]

const EXPENSE_CATEGORIES = [
    'Office Supplies', 'Food & Dining', 'Cloud Services', 'Transportation',
    'Travel & Accommodation', 'Professional Services', 'Software & Subscriptions',
    'Hardware & Equipment', 'Marketing & Advertising', 'Utilities',
    'Insurance', 'Rent & Facilities', 'Shipping & Logistics',
    'Training & Education', 'Entertainment', 'Other'
]

interface ReceiptAnalysis {
    isReceipt: boolean
    confidence: number
    vendor: string | null
    amount: number | null
    currency: string | null
    date: string | null
    category: string | null
    taxAmount: number | null
    lineItems: Array<{
        description: string
        quantity?: number
        unitPrice?: number
        total?: number
    }>
    paymentMethod: string | null
    extractedText: string | null
    reason?: string
}

// AI-powered OCR analysis using OpenAI Vision
async function analyzeWithAI(file: File): Promise<ReceiptAnalysis> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        throw new Error('OpenAI API key not configured')
    }

    const openai = new OpenAI({ apiKey })

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

    const prompt = `Analyze this image and perform OCR (Optical Character Recognition) to extract all text.
Then determine if it's a receipt, invoice, or bill.

If it IS a receipt/invoice/bill, extract the following information in JSON format:
{
  "isReceipt": true,
  "confidence": <0-1 float indicating confidence>,
  "vendor": "<business/store name>",
  "amount": <total amount as number>,
  "currency": "<currency code like EUR, USD, GBP>",
  "date": "<date in YYYY-MM-DD format if visible>",
  "category": "<one of: ${EXPENSE_CATEGORIES.join(', ')}>",
  "taxAmount": <tax/VAT amount as number if visible>,
  "lineItems": [{"description": "<item name>", "quantity": <qty>, "unitPrice": <price>, "total": <total>}],
  "paymentMethod": "<cash/card/other if visible>",
  "extractedText": "<ALL text extracted from the receipt via OCR>"
}

If it is NOT a receipt/invoice/bill, return:
{
  "isReceipt": false,
  "confidence": 0,
  "vendor": null,
  "amount": null,
  "currency": null,
  "date": null,
  "category": null,
  "taxAmount": null,
  "lineItems": [],
  "paymentMethod": null,
  "extractedText": "<any text visible in the image>",
  "reason": "<explain what the image shows instead>"
}

Return ONLY valid JSON, no markdown formatting.`

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:${mimeType};base64,${base64}`,
                            detail: 'high'
                        }
                    }
                ]
            }
        ],
        max_tokens: 2000,
        temperature: 0.1
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
        throw new Error('No response from AI')
    }

    // Parse JSON response
    let jsonStr = content.trim()
    if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    }

    const result = JSON.parse(jsonStr) as ReceiptAnalysis

    return {
        isReceipt: result.isReceipt ?? false,
        confidence: result.confidence ?? 0,
        vendor: result.vendor ?? null,
        amount: result.amount ?? null,
        currency: result.currency ?? 'EUR',
        date: result.date ?? null,
        category: result.category ?? null,
        taxAmount: result.taxAmount ?? null,
        lineItems: result.lineItems ?? [],
        paymentMethod: result.paymentMethod ?? null,
        extractedText: result.extractedText ?? null,
        reason: result.reason
    }
}

// Fallback analysis when AI is not available
function fallbackAnalysis(file: File): ReceiptAnalysis {
    const RECEIPT_KEYWORDS = [
        'receipt', 'invoice', 'total', 'subtotal', 'tax', 'payment',
        'amount', 'paid', 'transaction', 'order', 'purchase', 'bill'
    ]

    const mockText = file.name.toLowerCase()
    let keywordMatches = 0
    for (const keyword of RECEIPT_KEYWORDS) {
        if (mockText.includes(keyword)) keywordMatches++
    }

    const confidence = Math.min(keywordMatches / 3 + 0.3, 0.6) // Baseline confidence for uploads
    const isReceipt = true // Assume user is uploading a valid receipt

    return {
        isReceipt,
        confidence,
        vendor: null,
        amount: null,
        currency: 'EUR',
        date: null,
        category: null,
        taxAmount: null,
        lineItems: [],
        paymentMethod: null,
        extractedText: 'OCR not available - configure OPENAI_API_KEY for AI-powered text extraction',
        reason: undefined
    }
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

        // Perform OCR and analysis
        let analysis: ReceiptAnalysis

        // Try AI-powered OCR for images
        if (file.type.startsWith('image/') && process.env.OPENAI_API_KEY) {
            try {
                // Clone file since we already read it
                const fileClone = new File([buffer], file.name, { type: file.type })
                analysis = await analyzeWithAI(fileClone)
                console.log('AI OCR analysis completed:', {
                    vendor: analysis.vendor,
                    amount: analysis.amount,
                    confidence: analysis.confidence
                })
            } catch (aiError) {
                console.error('AI OCR failed, using fallback:', aiError)
                analysis = fallbackAnalysis(file)
            }
        } else {
            // Use fallback for PDFs or when AI is not configured
            analysis = fallbackAnalysis(file)
        }

        if (!analysis.isReceipt && analysis.reason) {
            return NextResponse.json({
                error: 'File does not appear to be a receipt',
                confidence: analysis.confidence,
                reason: analysis.reason,
                suggestion: 'Please upload an image or PDF of a receipt with visible transaction details'
            }, { status: 422 })
        }

        // Create receipt record with OCR-extracted data
        const receipt = await prisma.receipt.create({
            data: {
                fileName: file.name,
                fileUrl,
                fileType: file.type,
                fileSize: file.size,
                vendor: analysis.vendor,
                amount: analysis.amount,
                currency: analysis.currency || 'EUR',
                date: analysis.date ? new Date(analysis.date) : null,
                category: analysis.category,
                taxAmount: analysis.taxAmount,
                paymentMethod: analysis.paymentMethod,
                confidence: analysis.confidence,
                extractedText: analysis.extractedText,
                lineItems: analysis.lineItems.length > 0 ? JSON.stringify(analysis.lineItems) : null,
                status: 'unmatched',
                ocrProcessed: !!process.env.OPENAI_API_KEY,
                organizationId: user.organizationId,
            }
        })

        return NextResponse.json({
            ...receipt,
            ocrEnabled: !!process.env.OPENAI_API_KEY,
            lineItems: analysis.lineItems,
        }, { status: 201 })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}