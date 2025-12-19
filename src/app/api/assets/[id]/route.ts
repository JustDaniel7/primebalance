// src/app/api/assets/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

// GET /api/assets/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  const {id} = await params;
  const asset = await prisma.asset.findFirst({
    where: { id: id, organizationId: user.organizationId },
    include: {
      components: true,
      parentAsset: { select: { id: true, name: true, assetNumber: true } },
      depreciationEntries: { orderBy: { periodStart: 'desc' }, take: 24 },
      events: { orderBy: { eventDate: 'desc' }, take: 20 },
      transfers: { orderBy: { transferDate: 'desc' } }
    }
  })
  
  if (!asset) return notFound('Asset not found')
  
  return NextResponse.json(asset)
}

// PATCH /api/assets/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  const {id} = await params;
  const body = await req.json()
  
  // Convert dates
  const dateFields = [
    'acquisitionDate', 'depreciationStartDate', 'lastDepreciationDate', 
    'nextDepreciationDate', 'insuranceExpiry', 'warrantyExpiry',
    'lastMaintenanceDate', 'nextMaintenanceDate', 'plannedDisposalDate',
    'lastRevaluationDate'
  ]
  dateFields.forEach(field => {
    if (body[field]) body[field] = new Date(body[field])
  })
  
  const result = await prisma.asset.updateMany({
    where: { id: id, organizationId: user.organizationId },
    data: body
  })
  
  if (result.count === 0) return notFound('Asset not found')
  
  const updated = await prisma.asset.findUnique({
    where: { id: id },
    include: {
      components: true,
      depreciationEntries: { orderBy: { periodStart: 'desc' }, take: 12 },
      events: { orderBy: { eventDate: 'desc' }, take: 10 }
    }
  })
  return NextResponse.json(updated)
}

// DELETE /api/assets/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  const {id} = await params;
  // Check if asset has components
  const asset = await prisma.asset.findFirst({
    where: { id: id, organizationId: user.organizationId },
    include: { components: { select: { id: true } } }
  })
  
  if (!asset) return notFound('Asset not found')
  
  if (asset.components.length > 0) {
    return NextResponse.json(
      { error: 'Cannot delete asset with components. Remove components first.' },
      { status: 400 }
    )
  }
  
  await prisma.asset.delete({ where: { id: id } })
  
  return NextResponse.json({ success: true })
}