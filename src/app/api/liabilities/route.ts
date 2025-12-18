// src/app/api/liabilities/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/liabilities
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  
  const where: any = { organizationId: user.organizationId }
  if (type) where.type = type
  if (status) where.status = status
  
  const [liabilities, total] = await Promise.all([
    prisma.liability.findMany({
      where,
      include: { 
        payments: { 
          orderBy: { paymentDate: 'desc' }, 
          take: 5 
        } 
      },
      orderBy: { maturityDate: 'asc' },
      take: limit,
      skip: offset,
    }),
    prisma.liability.count({ where })
  ])
  
  // Calculate summary stats
  const summary = await prisma.liability.aggregate({
    where: { organizationId: user.organizationId, status: 'active' },
    _sum: {
      outstandingAmount: true,
      creditLimit: true,
      availableCredit: true,
    }
  })
  
  return NextResponse.json({ liabilities, total, limit, offset, summary })
}

// POST /api/liabilities
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const {
    type,
    name,
    description,
    reference,
    counterpartyId,
    counterpartyName,
    counterpartyType,
    currency,
    principalAmount,
    outstandingAmount,
    creditLimit,
    availableCredit,
    interestRate,
    interestType,
    startDate,
    maturityDate,
    nextPaymentDate,
    paymentFrequency,
    paymentAmount,
    paymentSchedule,
    isSecured,
    collateralDescription,
    collateralValue,
    covenants,
    riskLevel,
    alertThreshold,
    tags,
    notes,
    attachments,
  } = body
  
  if (!type || !name || !counterpartyName || !principalAmount || !startDate) {
    return badRequest('Missing required fields')
  }
  
  // Calculate utilization if credit facility
  let utilizationRate = null
  if (creditLimit && outstandingAmount) {
    utilizationRate = (Number(outstandingAmount) / Number(creditLimit)) * 100
  }
  
  const liability = await prisma.liability.create({
    data: {
      type,
      name,
      description,
      reference,
      counterpartyId,
      counterpartyName,
      counterpartyType,
      currency: currency || 'EUR',
      principalAmount,
      outstandingAmount: outstandingAmount ?? principalAmount,
      creditLimit,
      availableCredit: availableCredit ?? (creditLimit ? Number(creditLimit) - Number(outstandingAmount || 0) : null),
      utilizationRate,
      interestRate,
      interestType,
      startDate: new Date(startDate),
      maturityDate: maturityDate ? new Date(maturityDate) : null,
      nextPaymentDate: nextPaymentDate ? new Date(nextPaymentDate) : null,
      paymentFrequency,
      paymentAmount,
      paymentSchedule,
      isSecured: isSecured || false,
      collateralDescription,
      collateralValue,
      covenants,
      riskLevel: riskLevel || 'low',
      alertThreshold,
      tags: tags || [],
      notes,
      attachments,
      organizationId: user.organizationId,
    }
  })
  
  return NextResponse.json(liability, { status: 201 })
}