// src/app/api/inventory/[id]/movements/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils'

// GET /api/inventory/[id]/movements
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  const {id} = await params;
  // Verify item belongs to org
  const item = await prisma.inventoryItem.findFirst({
    where: { id: id, organizationId: user.organizationId }
  })
  if (!item) return notFound('Inventory item not found')
  
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  
  const where: any = { inventoryItemId: id }
  if (type) where.type = type
  
  const [movements, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      include: { batch: true },
      orderBy: { movementDate: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.inventoryMovement.count({ where })
  ])
  
  return NextResponse.json({ movements, total, limit, offset })
}

// POST /api/inventory/[id]/movements
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  const {id} = await params;
  // Get current item
  const item = await prisma.inventoryItem.findFirst({
    where: { id: id, organizationId: user.organizationId }
  })
  if (!item) return notFound('Inventory item not found')
  
  const body = await req.json()
  const {
    type,
    quantity,
    unitCost,
    referenceType,
    referenceId,
    referenceNumber,
    fromWarehouseId,
    fromLocation,
    toWarehouseId,
    toLocation,
    batchId,
    serialNumber,
    reason,
    notes,
  } = body
  
  if (!type || quantity === undefined) {
    return badRequest('Missing required fields: type, quantity')
  }
  
  const previousQuantity = Number(item.quantityOnHand)
  let newQuantity = previousQuantity
  
  // Calculate new quantity based on movement type
  switch (type) {
    case 'receipt':
    case 'return':
      newQuantity = previousQuantity + Math.abs(Number(quantity))
      break
    case 'issue':
    case 'scrap':
      newQuantity = previousQuantity - Math.abs(Number(quantity))
      break
    case 'adjustment':
    case 'count':
      newQuantity = Number(quantity) // Direct set
      break
    case 'transfer':
      // For transfers, quantity represents what moved out
      newQuantity = previousQuantity - Math.abs(Number(quantity))
      break
  }
  
  if (newQuantity < 0) {
    return badRequest('Insufficient quantity for this movement')
  }
  
  // Create movement record
  const movement = await prisma.inventoryMovement.create({
    data: {
      type,
      quantity: Math.abs(Number(quantity)),
      previousQuantity,
      newQuantity,
      unitCost: unitCost ?? item.unitCost,
      totalCost: unitCost ? Math.abs(Number(quantity)) * Number(unitCost) : null,
      referenceType,
      referenceId,
      referenceNumber,
      fromWarehouseId,
      fromLocation,
      toWarehouseId: toWarehouseId ?? item.warehouseId,
      toLocation: toLocation ?? item.location,
      batchId,
      serialNumber,
      reason,
      notes,
      performedBy: user.id,
      inventoryItemId: id,
    }
  })
  
  // Update item quantities
  const newAvailable = newQuantity - Number(item.quantityReserved)
  
  // Update average cost for receipts
  let newAverageCost = item.averageCost
  if (type === 'receipt' && unitCost) {
    const totalOldValue = previousQuantity * Number(item.averageCost)
    const newValue = Math.abs(Number(quantity)) * Number(unitCost)
    newAverageCost = newQuantity > 0 
      ? (totalOldValue + newValue) / newQuantity 
      : unitCost
  }
  
  await prisma.inventoryItem.update({
    where: { id: id },
    data: {
      quantityOnHand: newQuantity,
      quantityAvailable: newAvailable,
      averageCost: newAverageCost,
      totalValue: newQuantity * Number(newAverageCost),
      lastPurchaseCost: type === 'receipt' && unitCost ? unitCost : item.lastPurchaseCost,
      status: newQuantity <= 0 ? 'out_of_stock' : 'active',
    }
  })
  
  return NextResponse.json(movement, { status: 201 })
}