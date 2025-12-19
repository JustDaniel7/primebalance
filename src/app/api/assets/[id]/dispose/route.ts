// src/app/api/assets/[id]/dispose/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils'

// POST /api/assets/[id]/dispose
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  const {id} = await params;
  const asset = await prisma.asset.findFirst({
    where: { id: id, organizationId: user.organizationId }
  })
  if (!asset) return notFound('Asset not found')
  
  if (asset.status === 'disposed' || asset.status === 'written_off') {
    return badRequest('Asset already disposed')
  }
  
  const body = await req.json()
  const {
    disposalDate,
    disposalType,
    salePrice,
    saleCurrency,
    buyerName,
    buyerReference,
    invoiceId,
    disposalCosts,
    taxAmount,
    taxTreatment,
    reason,
    notes,
    attachments,
  } = body
  
  if (!disposalDate || !disposalType || !reason) {
    return badRequest('Missing required fields: disposalDate, disposalType, reason')
  }
  
  const carryingAmount = Number(asset.currentBookValue)
  const accumulatedDep = Number(asset.accumulatedDepreciation)
  const proceeds = Number(salePrice || 0) - Number(disposalCosts || 0)
  const gainOrLoss = proceeds - carryingAmount
  const isGain = gainOrLoss > 0
  
  // Create disposal record
  const disposal = await prisma.assetDisposal.create({
    data: {
      disposalDate: new Date(disposalDate),
      disposalType,
      carryingAmount,
      accumulatedDepreciation: accumulatedDep,
      salePrice,
      saleCurrency: saleCurrency || asset.currency,
      buyerName,
      buyerReference,
      invoiceId,
      gainOrLoss: Math.abs(gainOrLoss),
      isGain,
      disposalCosts: disposalCosts || 0,
      taxAmount,
      taxTreatment,
      reason,
      notes,
      attachments,
      assetId: id,
      organizationId: user.organizationId,
    }
  })
  
  // Update asset status
  await prisma.asset.update({
    where: { id: id },
    data: {
      status: disposalType === 'write_off' ? 'written_off' : 'disposed',
      currentBookValue: 0,
    }
  })
  
  // Create event
  await prisma.assetEvent.create({
    data: {
      type: 'disposal',
      description: `Asset ${disposalType}: ${reason}`,
      amount: proceeds,
      previousValue: carryingAmount,
      newValue: 0,
      eventDate: new Date(disposalDate),
      referenceType: 'disposal',
      referenceId: disposal.id,
      performedBy: user.id,
      assetId: id,
    }
  })
  
  return NextResponse.json(disposal, { status: 201 })
}