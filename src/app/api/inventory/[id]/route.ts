// src/app/api/inventory/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

// GET /api/inventory/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const {id} = await params;
  const item = await prisma.inventoryItem.findFirst({
    where: { id: id, organizationId: user.organizationId },
    include: {
      batches: { orderBy: { expiryDate: 'asc' } },
      movements: { 
        orderBy: { movementDate: 'desc' },
        take: 20
      }
    }
  })
  
  if (!item) return notFound('Inventory item not found')
  
  return NextResponse.json(item)
}

// PATCH /api/inventory/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const {id} = await params;
  // Recalculate derived fields if quantities or costs change
  if (body.quantityOnHand !== undefined || body.unitCost !== undefined) {
    const current = await prisma.inventoryItem.findFirst({
      where: { id: id, organizationId: user.organizationId }
    })
    if (current) {
      const qty = body.quantityOnHand ?? current.quantityOnHand
      const reserved = body.quantityReserved ?? current.quantityReserved
      const cost = body.unitCost ?? current.unitCost
      
      body.quantityAvailable = Number(qty) - Number(reserved)
      body.totalValue = Number(qty) * Number(cost)
    }
  }
  
  const result = await prisma.inventoryItem.updateMany({
    where: { id: id, organizationId: user.organizationId },
    data: body
  })
  
  if (result.count === 0) return notFound('Inventory item not found')
  
  const updated = await prisma.inventoryItem.findUnique({ 
    where: { id: id },
    include: { batches: true }
  })
  return NextResponse.json(updated)
}

// DELETE /api/inventory/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const {id} = await params;
  const result = await prisma.inventoryItem.deleteMany({
    where: { id: id, organizationId: user.organizationId }
  })
  
  if (result.count === 0) return notFound('Inventory item not found')
  
  return NextResponse.json({ success: true })
}