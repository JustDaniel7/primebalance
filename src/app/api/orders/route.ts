// src/app/api/orders/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/orders
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const customerId = searchParams.get('customerId')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  
  const where: any = { organizationId: user.organizationId }
  if (status) where.status = status
  if (customerId) where.customerId = customerId
  
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { invoices: { select: { id: true, invoiceNumber: true, status: true, total: true } } },
      orderBy: { orderDate: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.order.count({ where })
  ])
  
  return NextResponse.json({ orders, total, limit, offset })
}

// POST /api/orders
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const {
    orderNumber,
    customerId,
    customerName,
    customerEmail,
    customerAddress,
    orderDate,
    expectedDeliveryDate,
    items,
    currency,
    subtotal,
    taxAmount,
    discountAmount,
    total,
    taxRate,
    totalQuantity,
    notes,
    internalNotes,
    tags,
    priority,
    isRecurring,
    recurringInterval,
  } = body
  
  if (!orderNumber || !customerName || !orderDate || !items) {
    return badRequest('Missing required fields')
  }
  
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId,
      customerName,
      customerEmail,
      customerAddress,
      orderDate: new Date(orderDate),
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      items,
      currency: currency || 'EUR',
      subtotal,
      taxAmount,
      discountAmount: discountAmount || 0,
      total,
      taxRate: taxRate || 0,
      totalQuantity: totalQuantity || 0,
      notes,
      internalNotes,
      tags: tags || [],
      priority: priority || 'normal',
      isRecurring: isRecurring || false,
      recurringInterval,
      organizationId: user.organizationId,
    }
  })
  
  return NextResponse.json(order, { status: 201 })
}