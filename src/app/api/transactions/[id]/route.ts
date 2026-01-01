// src/app/api/transactions/[id]/route.ts
// NEW FILE: Single transaction operations

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

type Params = { params: Promise<{ id: string }> }

// GET /api/transactions/:id
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params
  const transaction = await prisma.transaction.findFirst({
    where: { id, organizationId: user.organizationId, deletedAt: null } as any,
    include: { account: true, receipts: true }
  })

  if (!transaction) return notFound('Transaction')
  return NextResponse.json(transaction)
}

// PATCH /api/transactions/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params
  const body = await req.json()

  const transaction = await prisma.transaction.updateMany({
    where: { id, organizationId: user.organizationId, deletedAt: null } as any,
    data: {
      ...body,
      date: body.date ? new Date(body.date) : undefined,
      updatedAt: new Date()
    }
  })

  if (transaction.count === 0) return notFound('Transaction')

  const updated = await prisma.transaction.findUnique({ where: { id } })
  return NextResponse.json(updated)
}

// DELETE /api/transactions/:id - Soft delete for audit trail
export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params

  // Soft delete: set deletedAt instead of actually deleting
  const result = await prisma.transaction.updateMany({
    where: { id, organizationId: user.organizationId, deletedAt: null } as any,
    data: { deletedAt: new Date() } as any
  })

  if (result.count === 0) return notFound('Transaction')
  return NextResponse.json({ success: true, message: 'Transaction archived' })
}