// src/app/api/suppliers/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

// GET /api/suppliers/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params

  const supplier = await prisma.supplier.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      contacts: { orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }] },
      balance: true,
      payments: { orderBy: { paymentDate: 'desc' }, take: 20 },
      reliability: { orderBy: { orderDate: 'desc' }, take: 20 },
      spend: { orderBy: { period: 'desc' } },
      risks: { orderBy: [{ status: 'asc' }, { overallRiskScore: 'desc' }] },
    },
  })

  if (!supplier) return notFound('Supplier not found')

  return NextResponse.json(supplier)
}

// PATCH /api/suppliers/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params
  const body = await req.json()

  const current = await prisma.supplier.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!current) return notFound('Supplier not found')

  const result = await prisma.supplier.update({
    where: { id },
    data: body,
    include: {
      contacts: true,
      balance: true,
      _count: { select: { payments: true, risks: true } },
    },
  })

  return NextResponse.json(result)
}

// DELETE /api/suppliers/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params

  const result = await prisma.supplier.deleteMany({
    where: { id, organizationId: user.organizationId },
  })

  if (result.count === 0) return notFound('Supplier not found')

  return NextResponse.json({ success: true })
}