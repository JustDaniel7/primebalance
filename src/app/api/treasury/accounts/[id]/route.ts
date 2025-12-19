// src/app/api/treasury/accounts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

// GET /api/treasury/accounts/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const {id} = await params;
  const account = await prisma.treasuryAccount.findFirst({
    where: { id: id, organizationId: user.organizationId },
    include: {
      cashMovements: { orderBy: { movementDate: 'desc' }, take: 50 }
    }
  })
  
  if (!account) return notFound('Treasury account not found')
  
  return NextResponse.json(account)
}

// PATCH /api/treasury/accounts/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()

  const {id} = await params;
  const result = await prisma.treasuryAccount.updateMany({
    where: { id: id, organizationId: user.organizationId },
    data: body
  })
  
  if (result.count === 0) return notFound('Treasury account not found')
  
  const updated = await prisma.treasuryAccount.findUnique({ where: { id: id } })
  return NextResponse.json(updated)
}

// DELETE /api/treasury/accounts/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const {id} = await params;
  const result = await prisma.treasuryAccount.deleteMany({
    where: { id: id, organizationId: user.organizationId }
  })
  
  if (result.count === 0) return notFound('Treasury account not found')
  
  return NextResponse.json({ success: true })
}