// src/app/api/liabilities/[id]/payments/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils'

// GET /api/liabilities/[id]/payments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  // Verify liability belongs to org
  const liability = await prisma.liability.findFirst({
    where: { id: params.id, organizationId: user.organizationId }
  })
  if (!liability) return notFound('Liability not found')
  
  const payments = await prisma.liabilityPayment.findMany({
    where: { liabilityId: params.id },
    orderBy: { paymentDate: 'desc' }
  })
  
  return NextResponse.json(payments)
}

// POST /api/liabilities/[id]/payments
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  // Verify liability belongs to org
  const liability = await prisma.liability.findFirst({
    where: { id: params.id, organizationId: user.organizationId }
  })
  if (!liability) return notFound('Liability not found')
  
  const body = await req.json()
  const {
    amount,
    principalAmount,
    interestAmount,
    feesAmount,
    currency,
    paymentDate,
    dueDate,
    status,
    reference,
    transactionId,
    notes,
  } = body
  
  if (!amount || !principalAmount || !paymentDate) {
    return badRequest('Missing required fields')
  }
  
  // Create payment
  const payment = await prisma.liabilityPayment.create({
    data: {
      amount,
      principalAmount,
      interestAmount: interestAmount || 0,
      feesAmount: feesAmount || 0,
      currency: currency || liability.currency,
      paymentDate: new Date(paymentDate),
      dueDate: dueDate ? new Date(dueDate) : null,
      status: status || 'completed',
      reference,
      transactionId,
      notes,
      liabilityId: params.id,
    }
  })
  
  // Update liability outstanding amount
  const newOutstanding = Number(liability.outstandingAmount) - Number(principalAmount)
  const newPaid = Number(liability.paidAmount) + Number(principalAmount)
  
  await prisma.liability.update({
    where: { id: params.id },
    data: {
      outstandingAmount: Math.max(0, newOutstanding),
      paidAmount: newPaid,
      lastPaymentDate: new Date(paymentDate),
      status: newOutstanding <= 0 ? 'paid_off' : liability.status,
      // Update available credit if applicable
      availableCredit: liability.creditLimit 
        ? Number(liability.creditLimit) - Math.max(0, newOutstanding)
        : null,
      utilizationRate: liability.creditLimit
        ? (Math.max(0, newOutstanding) / Number(liability.creditLimit)) * 100
        : null,
    }
  })
  
  return NextResponse.json(payment, { status: 201 })
}