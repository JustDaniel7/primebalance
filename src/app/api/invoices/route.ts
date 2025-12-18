// src/app/api/invoices/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/invoices
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  
  const where: any = { organizationId: user.organizationId }
  if (status) where.status = status
  
  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { invoiceDate: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.invoice.count({ where })
  ])
  
  return NextResponse.json({ invoices, total, limit, offset })
}

// POST /api/invoices
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const {
    invoiceNumber,
    sender,
    recipient,
    invoiceDate,
    dueDate,
    serviceDate,
    servicePeriodStart,
    servicePeriodEnd,
    items,
    currency,
    subtotal,
    taxAmount,
    total,
    applyTax,
    taxRate,
    taxExemptReason,
    taxExemptNote,
    payment,
    notes,
    internalNotes,
    language,
    isRecurring,
    recurringInterval,
    nextRecurringDate,
    orderId,
  } = body
  
  if (!invoiceNumber || !sender || !recipient || !invoiceDate || !dueDate || !items) {
    return badRequest('Missing required fields')
  }
  
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      sender,
      recipient,
      invoiceDate: new Date(invoiceDate),
      dueDate: new Date(dueDate),
      serviceDate: serviceDate ? new Date(serviceDate) : null,
      servicePeriodStart: servicePeriodStart ? new Date(servicePeriodStart) : null,
      servicePeriodEnd: servicePeriodEnd ? new Date(servicePeriodEnd) : null,
      items,
      currency: currency || 'EUR',
      subtotal,
      taxAmount,
      total,
      applyTax: applyTax ?? true,
      taxRate: taxRate || 0,
      taxExemptReason,
      taxExemptNote,
      payment,
      notes,
      internalNotes,
      language: language || 'en',
      isRecurring: isRecurring || false,
      recurringInterval,
      nextRecurringDate: nextRecurringDate ? new Date(nextRecurringDate) : null,
      orderId,
      organizationId: user.organizationId,
    }
  })
  
  return NextResponse.json(invoice, { status: 201 })
}