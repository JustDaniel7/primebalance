// src/app/api/treasury/buckets/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/treasury/buckets
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const buckets = await prisma.capitalBucket.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { priority: 'asc' }
  })
  
  return NextResponse.json(buckets)
}

// POST /api/treasury/buckets
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const {
    name,
    type,
    description,
    currency,
    targetAmount,
    currentAmount,
    minimumAmount,
    priority,
    isRequired,
    autoFund,
    fundingSourceAccountId,
    timeHorizon,
    targetDate,
    notes,
    tags,
  } = body
  
  if (!name || !type || targetAmount === undefined) {
    return badRequest('Missing required fields: name, type, targetAmount')
  }
  
  const current = currentAmount || 0
  const target = targetAmount
  const fundingPercent = target > 0 ? (current / target) * 100 : 0
  let fundingStatus = 'underfunded'
  if (fundingPercent >= 100) fundingStatus = 'overfunded'
  else if (fundingPercent >= 95) fundingStatus = 'funded'
  
  const bucket = await prisma.capitalBucket.create({
    data: {
      name,
      type,
      description,
      currency: currency || 'EUR',
      targetAmount,
      currentAmount: current,
      minimumAmount: minimumAmount || 0,
      fundingStatus,
      fundingPercent,
      priority: priority || 5,
      isRequired: isRequired || false,
      autoFund: autoFund || false,
      fundingSourceAccountId,
      timeHorizon,
      targetDate: targetDate ? new Date(targetDate) : null,
      notes,
      tags: tags || [],
      organizationId: user.organizationId,
    }
  })
  
  return NextResponse.json(bucket, { status: 201 })
}