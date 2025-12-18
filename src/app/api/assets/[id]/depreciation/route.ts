// src/app/api/assets/[id]/depreciation/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils'

// GET /api/assets/[id]/depreciation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const asset = await prisma.asset.findFirst({
    where: { id: params.id, organizationId: user.organizationId }
  })
  if (!asset) return notFound('Asset not found')
  
  const { searchParams } = new URL(req.url)
  const bookType = searchParams.get('bookType') || 'statutory'
  const fiscalYear = searchParams.get('fiscalYear')
  
  const where: any = { assetId: params.id, bookType }
  if (fiscalYear) where.fiscalYear = parseInt(fiscalYear)
  
  const entries = await prisma.assetDepreciation.findMany({
    where,
    orderBy: { periodStart: 'desc' }
  })
  
  return NextResponse.json(entries)
}

// POST /api/assets/[id]/depreciation - Calculate/record depreciation
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const asset = await prisma.asset.findFirst({
    where: { id: params.id, organizationId: user.organizationId }
  })
  if (!asset) return notFound('Asset not found')
  
  if (!asset.isDepreciable) {
    return badRequest('Asset is not depreciable')
  }
  
  if (asset.status === 'fully_depreciated' || asset.status === 'disposed') {
    return badRequest(`Cannot depreciate ${asset.status} asset`)
  }
  
  const body = await req.json()
  const {
    periodStart,
    periodEnd,
    fiscalYear,
    fiscalPeriod,
    bookType,
    depreciationAmount: customAmount,
  } = body
  
  if (!periodStart || !periodEnd || !fiscalYear) {
    return badRequest('Missing required fields: periodStart, periodEnd, fiscalYear')
  }
  
  // Calculate depreciation amount
  let depreciationAmount = customAmount
  
  if (!depreciationAmount) {
    const depreciableAmount = Number(asset.acquisitionCost) - Number(asset.residualValue)
    
    switch (asset.depreciationMethod) {
      case 'straight_line':
        if (asset.usefulLifeMonths) {
          depreciationAmount = depreciableAmount / asset.usefulLifeMonths
        }
        break
      case 'declining_balance':
        if (asset.depreciationRate) {
          depreciationAmount = Number(asset.currentBookValue) * (Number(asset.depreciationRate) / 100)
        }
        break
      default:
        depreciationAmount = asset.monthlyDepreciation || 0
    }
  }
  
  // Ensure we don't depreciate below residual value
  const maxDepreciation = Number(asset.currentBookValue) - Number(asset.residualValue)
  depreciationAmount = Math.min(Number(depreciationAmount), maxDepreciation)
  
  if (depreciationAmount <= 0) {
    return badRequest('No depreciation to record - asset at residual value')
  }
  
  const openingBookValue = Number(asset.currentBookValue)
  const newAccumulatedDep = Number(asset.accumulatedDepreciation) + depreciationAmount
  const closingBookValue = openingBookValue - depreciationAmount
  
  // Create depreciation entry
  const entry = await prisma.assetDepreciation.create({
    data: {
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      fiscalYear,
      fiscalPeriod,
      depreciationAmount,
      accumulatedDepreciation: newAccumulatedDep,
      openingBookValue,
      closingBookValue,
      method: asset.depreciationMethod,
      rate: asset.depreciationRate,
      bookType: bookType || 'statutory',
      assetId: params.id,
    }
  })
  
  // Update asset
  const isFullyDepreciated = closingBookValue <= Number(asset.residualValue)
  
  await prisma.asset.update({
    where: { id: params.id },
    data: {
      currentBookValue: closingBookValue,
      accumulatedDepreciation: newAccumulatedDep,
      lastDepreciationDate: new Date(periodEnd),
      status: isFullyDepreciated ? 'fully_depreciated' : asset.status,
    }
  })
  
  // Create event
  await prisma.assetEvent.create({
    data: {
      type: 'depreciation',
      description: `Depreciation recorded for ${fiscalPeriod || fiscalYear}`,
      amount: depreciationAmount,
      previousValue: openingBookValue,
      newValue: closingBookValue,
      eventDate: new Date(periodEnd),
      performedBy: user.id,
      assetId: params.id,
    }
  })
  
  return NextResponse.json(entry, { status: 201 })
}