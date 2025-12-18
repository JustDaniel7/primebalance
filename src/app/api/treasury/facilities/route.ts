// src/app/api/treasury/facilities/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/treasury/facilities
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  
  const where: any = { organizationId: user.organizationId }
  if (status) where.status = status
  
  const facilities = await prisma.creditFacility.findMany({
    where,
    include: {
      drawdowns: { orderBy: { drawdownDate: 'desc' } }
    },
    orderBy: { maturityDate: 'asc' }
  })
  
  return NextResponse.json(facilities)
}

// POST /api/treasury/facilities
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const {
    name,
    type,
    lenderName,
    lenderId,
    currency,
    facilityLimit,
    drawnAmount,
    interestRate,
    interestType,
    spreadBps,
    commitmentFeeBps,
    arrangementFee,
    startDate,
    maturityDate,
    nextReviewDate,
    covenants,
    isSecured,
    securityDescription,
    reference,
    notes,
    documents,
  } = body
  
  if (!name || !type || !lenderName || !facilityLimit || !startDate || !maturityDate) {
    return badRequest('Missing required fields')
  }
  
  const drawn = drawnAmount || 0
  const available = Number(facilityLimit) - Number(drawn)
  const utilizationRate = Number(facilityLimit) > 0 
    ? (Number(drawn) / Number(facilityLimit)) * 100 
    : 0
  
  const facility = await prisma.creditFacility.create({
    data: {
      name,
      type,
      lenderName,
      lenderId,
      currency: currency || 'EUR',
      facilityLimit,
      drawnAmount: drawn,
      availableAmount: available,
      utilizationRate,
      interestRate,
      interestType,
      spreadBps,
      commitmentFeeBps,
      arrangementFee,
      startDate: new Date(startDate),
      maturityDate: new Date(maturityDate),
      nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : null,
      covenants,
      isSecured: isSecured || false,
      securityDescription,
      reference,
      notes,
      documents,
      organizationId: user.organizationId,
    }
  })
  
  return NextResponse.json(facility, { status: 201 })
}