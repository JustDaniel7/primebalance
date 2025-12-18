// src/app/api/archive/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

// GET /api/archive/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const item = await prisma.archiveItem.findFirst({
    where: { id: params.id, organizationId: user.organizationId }
  })
  
  if (!item) return notFound('Archive item not found')
  
  return NextResponse.json(item)
}

// PATCH /api/archive/[id] - mainly for restore
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  
  // Handle restore action
  if (body.action === 'restore') {
    const item = await prisma.archiveItem.updateMany({
      where: { id: params.id, organizationId: user.organizationId },
      data: {
        status: 'restored',
        restoredAt: new Date(),
        restoredBy: user.id,
      }
    })
    
    if (item.count === 0) return notFound('Archive item not found')
    
    const updated = await prisma.archiveItem.findUnique({ where: { id: params.id } })
    return NextResponse.json(updated)
  }
  
  // Regular update
  const item = await prisma.archiveItem.updateMany({
    where: { id: params.id, organizationId: user.organizationId },
    data: body
  })
  
  if (item.count === 0) return notFound('Archive item not found')
  
  const updated = await prisma.archiveItem.findUnique({ where: { id: params.id } })
  return NextResponse.json(updated)
}

// DELETE /api/archive/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const result = await prisma.archiveItem.deleteMany({
    where: { id: params.id, organizationId: user.organizationId }
  })
  
  if (result.count === 0) return notFound('Archive item not found')
  
  return NextResponse.json({ success: true })
}