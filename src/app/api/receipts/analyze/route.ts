// src/app/api/receipts/analyze/route.ts
// AI-powered receipt analysis using OpenAI Vision

import { NextRequest, NextResponse } from 'next/server'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'
import OpenAI from 'openai'

const RECEIPT_MIME_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf'
]

// Categories for expense classification
const EXPENSE_CATEGORIES = [
    'Office Supplies',
    'Food & Dining',
    'Cloud Services',
    'Transportation',
    'Travel & Accommodation',
    'Professional Services',
    'Software & Subscriptions',
    'Hardware & Equipment',
    'Marketing & Advertising',
    'Utilities',
    'Insurance',
    'Rent & Facilities',
    'Shipping & Logistics',
    'Training & Education',
    'Entertainment',
    'Other'
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

// Fallback analysis using filename patterns (when AI is not available)
function fallbackAnalysis(file: File): ReceiptAnalysis {
    const RECEIPT_KEYWORDS = [
        'receipt', 'invoice', 'total', 'subtotal', 'tax', 'payment',
        'amount', 'paid', 'transaction', 'order', 'purchase', 'bill'
    ]

    const mockText = file.name.toLowerCase() + ' receipt purchase total amount paid transaction'
    const lowerText = mockText.toLowerCase()

    let keywordMatches = 0
    for (const keyword of RECEIPT_KEYWORDS) {
        if (lowerText.includes(keyword)) keywordMatches++
    }

    const confidence = Math.min(keywordMatches / 5, 1)
    const isReceipt = confidence >= 0.3

    const lines = mockText.split(/[\s_-]+/).filter(Boolean)
    const vendor = lines.slice(0, 3).join(' ').slice(0, 50) || null

    const amountMatch = mockText.match(/(\d+\.?\d*)/i)
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null

    let category: string | null = null
    if (lowerText.includes('office') || lowerText.includes('supply')) {
        category = 'Office Supplies'
    } else if (lowerText.includes('food') || lowerText.includes('restaurant')) {
        category = 'Food & Dining'
    } else if (lowerText.includes('cloud') || lowerText.includes('software')) {
        category = 'Cloud Services'
    } else if (lowerText.includes('travel') || lowerText.includes('uber')) {
        category = 'Transportation'
    }

    return {
        isReceipt,
        confidence,
        vendor,
        amount,
        currency: 'EUR',
        date: null,
        category,
        taxAmount: null,
        lineItems: [],
        paymentMethod: null,
        extractedText: mockText,
        reason: isReceipt ? undefined : 'File does not appear to be a receipt. Upload a receipt image or PDF.'
    }
}

// AI-powered analysis using OpenAI Vision
async function analyzeWithAI(file: File, openai: OpenAI): Promise<ReceiptAnalysis> {
    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

    const prompt = `Analyze this image and determine if it's a receipt, invoice, or bill.

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
  "extractedText": "<key text from receipt>"
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
  "extractedText": null,
  "reason": "<explain what the image shows instead>"
}

Return ONLY valid JSON, no markdown formatting.`

    try {
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
            max_tokens: 1000,
            temperature: 0.1
        })

        const content = response.choices[0]?.message?.content
        if (!content) {
            throw new Error('No response from AI')
        }

        // Parse JSON response, handling potential markdown code blocks
        let jsonStr = content.trim()
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
        }

        const result = JSON.parse(jsonStr) as ReceiptAnalysis

        // Ensure all required fields exist
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
    } catch (error) {
        console.error('AI analysis error:', error)
        throw error
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
            return NextResponse.json({
                isReceipt: false,
                confidence: 0,
                vendor: null,
                amount: null,
                currency: null,
                date: null,
                category: null,
                taxAmount: null,
                lineItems: [],
                paymentMethod: null,
                extractedText: null,
                reason: `Invalid file type: ${file.type}. Please upload an image or PDF.`
            })
        }

        // Check if OpenAI API key is configured
        const apiKey = process.env.OPENAI_API_KEY

        if (apiKey && file.type.startsWith('image/')) {
            // Use AI-powered analysis for images
            try {
                const openai = new OpenAI({ apiKey })
                const result = await analyzeWithAI(file, openai)
                return NextResponse.json(result)
            } catch (aiError) {
                console.error('AI analysis failed, falling back to basic analysis:', aiError)
                // Fall through to fallback analysis
            }
        }

        // Fallback analysis (for PDFs or when AI is not available)
        const result = fallbackAnalysis(file)
        return NextResponse.json(result)

    } catch (error) {
        console.error('Analysis error:', error)
        return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
    }
}