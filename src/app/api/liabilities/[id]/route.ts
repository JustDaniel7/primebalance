// src/app/api/liabilities/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

// GET /api/liabilities/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const {id} = await params;
  const liability = await prisma.liability.findFirst({
    where: { id: id, organizationId: user.organizationId },
    include: { 
      payments: { orderBy: { paymentDate: 'desc' } } 
    }
  })
  
  if (!liability) return notFound('Liability not found')
  
  return NextResponse.json(liability)
}

// PATCH /api/liabilities/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const {id} = await params;
  // Convert date strings
  if (body.startDate) body.startDate = new Date(body.startDate)
  if (body.maturityDate) body.maturityDate = new Date(body.maturityDate)
  if (body.nextPaymentDate) body.nextPaymentDate = new Date(body.nextPaymentDate)
  if (body.lastPaymentDate) body.lastPaymentDate = new Date(body.lastPaymentDate)
  
  // Recalculate utilization if relevant fields changed
  if (body.creditLimit !== undefined || body.outstandingAmount !== undefined) {
    const current = await prisma.liability.findFirst({
      where: { id: id, organizationId: user.organizationId }
    })
    if (current) {
      const creditLimit = body.creditLimit ?? current.creditLimit
      const outstandingAmount = body.outstandingAmount ?? current.outstandingAmount
      if (creditLimit) {
        body.utilizationRate = (Number(outstandingAmount) / Number(creditLimit)) * 100
        body.availableCredit = Number(creditLimit) - Number(outstandingAmount)
      }
    }
  }
  
  const result = await prisma.liability.updateMany({
    where: { id: id, organizationId: user.organizationId },
    data: body
  })
  
  if (result.count === 0) return notFound('Liability not found')
  
  const updated = await prisma.liability.findUnique({ 
    where: { id: id },
    include: { payments: { orderBy: { paymentDate: 'desc' } } }
  })
  return NextResponse.json(updated)
}

// DELETE /api/liabilities/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const {id} = await params;
  const result = await prisma.liability.deleteMany({
    where: { id: id, organizationId: user.organizationId }
  })
  
  if (result.count === 0) return notFound('Liability not found')
  
  return NextResponse.json({ success: true })
}