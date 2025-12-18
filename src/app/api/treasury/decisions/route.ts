// src/app/api/treasury/decisions/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/treasury/decisions
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  
  const where: any = { organizationId: user.organizationId }
  if (status) where.status = status
  if (type) where.type = type
  
  const decisions = await prisma.treasuryDecision.findMany({
    where,
    orderBy: [
      { priority: 'asc' },
      { createdAt: 'desc' }
    ]
  })
  
  return NextResponse.json(decisions)
}

// POST /api/treasury/decisions
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const {
    type,
    title,
    description,
    priority,
    currency,
    amount,
    riskDelta,
    requiresApproval,
    approvalThreshold,
    executionMode,
    scheduledDate,
    expiresAt,
    sourceAccountId,
    targetAccountId,
    facilityId,
    bucketId,
    alternatives,
    notes,
    metadata,
  } = body
  
  if (!type || !title || amount === undefined) {
    return badRequest('Missing required fields: type, title, amount')
  }
  
  const decision = await prisma.treasuryDecision.create({
    data: {
      type,
      title,
      description,
      priority: priority || 'normal',
      currency: currency || 'EUR',
      amount,
      riskDelta,
      requiresApproval: requiresApproval ?? true,
      approvalThreshold,
      executionMode: executionMode || 'manual',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      sourceAccountId,
      targetAccountId,
      facilityId,
      bucketId,
      alternatives,
      notes,
      metadata,
      organizationId: user.organizationId,
    }
  })
  
  return NextResponse.json(decision, { status: 201 })
}