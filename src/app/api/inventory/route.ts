// src/app/api/inventory/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/inventory
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const warehouseId = searchParams.get('warehouseId')
  const lowStock = searchParams.get('lowStock') === 'true'
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  
  const where: any = { organizationId: user.organizationId }
  if (type) where.type = type
  if (status) where.status = status
  if (category) where.category = category
  if (warehouseId) where.warehouseId = warehouseId
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search, mode: 'insensitive' } },
    ]
  }
  
  // Low stock filter - items where available < reorderPoint
  if (lowStock) {
    // Use raw query approach instead
  }
  
  let items, total
  
  if (lowStock) {
    // Use raw query for low stock filter
    const lowStockItems = await prisma.$queryRaw<any[]>`
      SELECT * FROM "InventoryItem"
      WHERE "organizationId" = ${user.organizationId}
      AND "quantityAvailable" < "reorderPoint"
      ${where.OR ? 'AND (' + where.OR.map(() => '"name" ILIKE $1 OR "sku" ILIKE $1 OR "barcode" ILIKE $1').join(' OR ') + ')' : ''}
      ORDER BY name ASC
      LIMIT ${limit} OFFSET ${offset}
    `
    items = lowStockItems
    const countResult = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM "InventoryItem"
      WHERE "organizationId" = ${user.organizationId}
      AND "quantityAvailable" < "reorderPoint"
    `
    total = Number(countResult[0]?.count || 0)
  } else {
    [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          batches: {
            where: { status: 'available' },
            orderBy: { expiryDate: 'asc' },
            take: 5
          }
        },
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.inventoryItem.count({ where })
    ])
  }
  
  // Calculate summary
  const summary = await prisma.inventoryItem.aggregate({
    where: { organizationId: user.organizationId, status: 'active' },
    _sum: { totalValue: true },
    _count: { id: true }
  })
  
  // Count low stock items
  const lowStockCount = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM "InventoryItem" 
    WHERE "organizationId" = ${user.organizationId} 
    AND status = 'active'
    AND "quantityAvailable" < "reorderPoint"
  ` as any[]
  
  return NextResponse.json({ 
    items, 
    total, 
    limit, 
    offset,
    summary: {
      totalItems: summary._count.id,
      totalValue: summary._sum.totalValue,
      lowStockCount: Number(lowStockCount[0]?.count || 0)
    }
  })
}

// POST /api/inventory
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const {
    type,
    sku,
    name,
    description,
    barcode,
    category,
    subcategory,
    quantityOnHand,
    unitOfMeasure,
    minimumStock,
    maximumStock,
    reorderPoint,
    reorderQuantity,
    currency,
    unitCost,
    sellingPrice,
    costingMethod,
    warehouseId,
    warehouseName,
    location,
    zone,
    ownershipType,
    supplierId,
    supplierName,
    isSerialTracked,
    isBatchTracked,
    isExpiryTracked,
    leadTimeDays,
    weight,
    weightUnit,
    length,
    width,
    height,
    dimensionUnit,
    tags,
    notes,
    imageUrl,
  } = body
  
  if (!type || !sku || !name) {
    return badRequest('Missing required fields: type, sku, name')
  }
  
  const qty = quantityOnHand || 0
  const cost = unitCost || 0
  
  const item = await prisma.inventoryItem.create({
    data: {
      type,
      sku,
      name,
      description,
      barcode,
      category,
      subcategory,
      quantityOnHand: qty,
      quantityAvailable: qty, // Initially all available
      unitOfMeasure: unitOfMeasure || 'pcs',
      minimumStock: minimumStock || 0,
      maximumStock,
      reorderPoint: reorderPoint || 0,
      reorderQuantity,
      currency: currency || 'EUR',
      unitCost: cost,
      averageCost: cost,
      sellingPrice,
      totalValue: qty * cost,
      costingMethod: costingMethod || 'average',
      warehouseId,
      warehouseName,
      location,
      zone,
      ownershipType: ownershipType || 'owned',
      supplierId,
      supplierName,
      isSerialTracked: isSerialTracked || false,
      isBatchTracked: isBatchTracked || false,
      isExpiryTracked: isExpiryTracked || false,
      leadTimeDays,
      weight,
      weightUnit,
      length,
      width,
      height,
      dimensionUnit,
      tags: tags || [],
      notes,
      imageUrl,
      organizationId: user.organizationId,
    }
  })
  
  return NextResponse.json(item, { status: 201 })
}