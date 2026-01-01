// src/app/api/receivables/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// Helper to calculate aging bucket
function getAgingBucket(daysOutstanding: number): string {
  if (daysOutstanding <= 0) return 'current'
  if (daysOutstanding <= 30) return '1-30'
  if (daysOutstanding <= 60) return '31-60'
  if (daysOutstanding <= 90) return '61-90'
  return '90+'
}

// Helper to calculate risk level
function getRiskLevel(daysOutstanding: number, amount: number): string {
  if (daysOutstanding > 90 || amount > 50000) return 'critical'
  if (daysOutstanding > 60 || amount > 20000) return 'high'
  if (daysOutstanding > 30 || amount > 10000) return 'medium'
  return 'low'
}

// GET /api/receivables
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const riskLevel = searchParams.get('riskLevel')
  const agingBucket = searchParams.get('agingBucket')
  const debtorId = searchParams.get('debtorId')
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  
  const where: Prisma.ReceivableWhereInput = { organizationId: user.organizationId }
  if (status) where.status = status
  if (riskLevel) where.riskLevel = riskLevel
  if (agingBucket) where.agingBucket = agingBucket
  if (debtorId) where.debtorId = debtorId
  if (search) {
    where.OR = [
      { debtorName: { contains: search, mode: 'insensitive' } },
      { reference: { contains: search, mode: 'insensitive' } },
      { originReferenceId: { contains: search, mode: 'insensitive' } },
    ]
  }
  
  const [receivables, total] = await Promise.all([
    prisma.receivable.findMany({
      where,
      include: {
        paymentApplications: { orderBy: { appliedAt: 'desc' }, take: 5 },
        events: { orderBy: { createdAt: 'desc' }, take: 5 }
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
      skip: offset,
    }),
    prisma.receivable.count({ where })
  ])
  
  // Calculate summary
  const summary = await prisma.receivable.groupBy({
    by: ['status'],
    where: { organizationId: user.organizationId },
    _sum: { outstandingAmount: true },
    _count: { id: true }
  })
  
  const agingSummary = await prisma.receivable.groupBy({
    by: ['agingBucket'],
    where: { organizationId: user.organizationId, status: { notIn: ['paid', 'written_off'] } },
    _sum: { outstandingAmount: true },
    _count: { id: true }
  })
  
  const totals = await prisma.receivable.aggregate({
    where: { organizationId: user.organizationId },
    _sum: {
      originalAmount: true,
      outstandingAmount: true,
      paidAmount: true,
    }
  })
  
  return NextResponse.json({ 
    receivables, 
    total, 
    limit, 
    offset,
    summary: {
      byStatus: summary,
      byAging: agingSummary,
      totals: totals._sum
    }
  })
}

// POST /api/receivables
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const {
    originType,
    originReferenceId,
    creditorEntityId,
    debtorId,
    debtorName,
    debtorEmail,
    debtorPhone,
    debtorAddress,
    currency,
    originalAmount,
    issueDate,
    dueDate,
    expectedPaymentDate,
    reference,
    description,
    notes,
    tags,
    autoRemindersEnabled,
  } = body
  
  if (!originType || !debtorName || !originalAmount || !issueDate || !dueDate) {
    return badRequest('Missing required fields')
  }
  
  const issueDt = new Date(issueDate)
  const dueDt = new Date(dueDate)
  const today = new Date()
  const daysOutstanding = Math.max(0, Math.floor((today.getTime() - dueDt.getTime()) / (1000 * 60 * 60 * 24)))
  const agingBucket = getAgingBucket(daysOutstanding)
  const riskLevel = getRiskLevel(daysOutstanding, Number(originalAmount))
  
  // Determine initial status
  let status = 'open'
  if (today > dueDt) {
    status = 'overdue'
  } else if (today.toDateString() === dueDt.toDateString()) {
    status = 'due'
  }
  
  const receivable = await prisma.receivable.create({
    data: {
      originType,
      originReferenceId,
      creditorEntityId,
      debtorId,
      debtorName,
      debtorEmail,
      debtorPhone,
      debtorAddress,
      currency: currency || 'EUR',
      originalAmount,
      outstandingAmount: originalAmount,
      issueDate: issueDt,
      dueDate: dueDt,
      expectedPaymentDate: expectedPaymentDate ? new Date(expectedPaymentDate) : null,
      lastActivityDate: new Date(),
      status,
      riskLevel,
      daysOutstanding,
      agingBucket,
      reference,
      description,
      notes,
      tags: tags || [],
      autoRemindersEnabled: autoRemindersEnabled ?? true,
      organizationId: user.organizationId,
      events: {
        create: {
          type: 'receivable_created',
          description: `Receivable created for ${debtorName}`,
          amount: originalAmount,
          performedBy: user.id,
        }
      }
    },
    include: { events: true }
  })
  
  return NextResponse.json(receivable, { status: 201 })
}