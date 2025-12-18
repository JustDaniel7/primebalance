// src/app/api/assets/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/assets
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const entityId = searchParams.get('entityId')
  const costCenterId = searchParams.get('costCenterId')
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  
  const where: any = { organizationId: user.organizationId }
  if (status) where.status = status
  if (category) where.category = category
  if (entityId) where.entityId = entityId
  if (costCenterId) where.costCenterId = costCenterId
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { assetNumber: { contains: search, mode: 'insensitive' } },
      { serialNumber: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }
  
  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        components: { select: { id: true, name: true, assetNumber: true, currentBookValue: true } },
        _count: { select: { depreciationEntries: true, events: true } }
      },
      orderBy: { assetNumber: 'asc' },
      take: limit,
      skip: offset,
    }),
    prisma.asset.count({ where })
  ])
  
  // Calculate summary
  const summary = await prisma.asset.aggregate({
    where: { organizationId: user.organizationId, status: { in: ['active', 'fully_depreciated'] } },
    _sum: {
      acquisitionCost: true,
      currentBookValue: true,
      accumulatedDepreciation: true,
    },
    _count: { id: true }
  })
  
  const byCategory = await prisma.asset.groupBy({
    by: ['category'],
    where: { organizationId: user.organizationId, status: { in: ['active', 'fully_depreciated'] } },
    _sum: { currentBookValue: true },
    _count: { id: true }
  })
  
  return NextResponse.json({
    assets,
    total,
    limit,
    offset,
    summary: {
      totalAssets: summary._count.id,
      totalAcquisitionCost: summary._sum.acquisitionCost,
      totalBookValue: summary._sum.currentBookValue,
      totalDepreciation: summary._sum.accumulatedDepreciation,
      byCategory
    }
  })
}

// POST /api/assets
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const {
    assetNumber,
    name,
    description,
    category,
    subcategory,
    assetClass,
    acquisitionDate,
    acquisitionType,
    acquisitionCost,
    currency,
    vendorId,
    vendorName,
    purchaseOrderRef,
    invoiceRef,
    residualValue,
    isDepreciable,
    depreciationMethod,
    usefulLifeMonths,
    usefulLifeUnits,
    depreciationRate,
    depreciationStartDate,
    locationId,
    locationName,
    locationAddress,
    costCenterId,
    costCenterName,
    responsibleParty,
    responsiblePartyId,
    entityId,
    entityName,
    serialNumber,
    modelNumber,
    manufacturer,
    barcode,
    quantity,
    unitOfMeasure,
    isInsured,
    insurancePolicy,
    insuredValue,
    insuranceExpiry,
    warrantyExpiry,
    warrantyTerms,
    requiresMaintenance,
    maintenanceSchedule,
    parentAssetId,
    tags,
    notes,
    attachments,
    customFields,
  } = body
  
  if (!assetNumber || !name || !category || !acquisitionDate || acquisitionCost === undefined) {
    return badRequest('Missing required fields: assetNumber, name, category, acquisitionDate, acquisitionCost')
  }
  
  const cost = Number(acquisitionCost)
  const residual = Number(residualValue || 0)
  
  // Calculate monthly depreciation if applicable
  let monthlyDep = null
  if (isDepreciable && usefulLifeMonths && depreciationMethod === 'straight_line') {
    monthlyDep = (cost - residual) / usefulLifeMonths
  }
  
  const asset = await prisma.asset.create({
    data: {
      assetNumber,
      name,
      description,
      category,
      subcategory,
      assetClass,
      acquisitionDate: new Date(acquisitionDate),
      acquisitionType: acquisitionType || 'purchase',
      acquisitionCost: cost,
      currency: currency || 'EUR',
      vendorId,
      vendorName,
      purchaseOrderRef,
      invoiceRef,
      currentBookValue: cost,
      residualValue: residual,
      isDepreciable: isDepreciable ?? true,
      depreciationMethod: depreciationMethod || 'straight_line',
      usefulLifeMonths,
      usefulLifeUnits,
      depreciationRate,
      depreciationStartDate: depreciationStartDate ? new Date(depreciationStartDate) : new Date(acquisitionDate),
      monthlyDepreciation: monthlyDep,
      locationId,
      locationName,
      locationAddress,
      costCenterId,
      costCenterName,
      responsibleParty,
      responsiblePartyId,
      entityId,
      entityName,
      serialNumber,
      modelNumber,
      manufacturer,
      barcode,
      quantity: quantity || 1,
      unitOfMeasure: unitOfMeasure || 'pcs',
      isInsured: isInsured || false,
      insurancePolicy,
      insuredValue,
      insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
      warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
      warrantyTerms,
      requiresMaintenance: requiresMaintenance || false,
      maintenanceSchedule,
      parentAssetId,
      tags: tags || [],
      notes,
      attachments,
      customFields,
      organizationId: user.organizationId,
      events: {
        create: {
          type: 'acquisition',
          description: `Asset acquired: ${name}`,
          amount: cost,
          newValue: cost,
          eventDate: new Date(acquisitionDate),
          performedBy: user.id,
        }
      }
    },
    include: { events: true }
  })
  
  return NextResponse.json(asset, { status: 201 })
}