// src/app/api/orders/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

// GET /api/orders/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const order = await prisma.order.findFirst({
    where: { id: params.id, organizationId: user.organizationId },
    include: { invoices: true }
  })
  
  if (!order) return notFound('Order not found')
  
  return NextResponse.json(order)
}

// PATCH /api/orders/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  
  // Convert date strings to Date objects
  if (body.orderDate) body.orderDate = new Date(body.orderDate)
  if (body.expectedDeliveryDate) body.expectedDeliveryDate = new Date(body.expectedDeliveryDate)
  if (body.completedDate) body.completedDate = new Date(body.completedDate)
  
  const order = await prisma.order.updateMany({
    where: { id: params.id, organizationId: user.organizationId },
    data: body
  })
  
  if (order.count === 0) return notFound('Order not found')
  
  const updated = await prisma.order.findUnique({ 
    where: { id: params.id },
    include: { invoices: true }
  })
  return NextResponse.json(updated)
}

// DELETE /api/orders/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const result = await prisma.order.deleteMany({
    where: { id: params.id, organizationId: user.organizationId }
  })
  
  if (result.count === 0) return notFound('Order not found')
  
  return NextResponse.json({ success: true })
}