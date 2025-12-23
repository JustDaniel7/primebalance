// src/app/api/suppliers/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/suppliers
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  const where: Record<string, unknown> = { organizationId: user.organizationId }
  if (status && status !== 'all') where.status = status
  if (category && category !== 'all') where.category = category
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { supplierNumber: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  const suppliers = await prisma.supplier.findMany({
    where,
    include: {
      contacts: { where: { isPrimary: true }, take: 1 },
      balance: true,
      _count: { select: { payments: true, risks: true } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ suppliers })
}

// POST /api/suppliers
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const body = await req.json()
  const {
    name,
    category = 'goods',
    status = 'active',
    email,
    phone,
    website,
    address,
    taxId,
    paymentTerms = 'Net 30',
    preferredPaymentMethod = 'wire',
    accountManagerName,
    tags,
    notes,
  } = body

  if (!name || !email) {
    return badRequest('Supplier name and email are required')
  }

  const count = await prisma.supplier.count({
    where: { organizationId: user.organizationId },
  })
  const supplierNumber = `S-${10001 + count}`

  const supplier = await prisma.supplier.create({
    data: {
      supplierNumber,
      name,
      category,
      status,
      email,
      phone,
      website,
      address,
      taxId,
      supplierSince: new Date(),
      paymentTerms,
      preferredPaymentMethod,
      accountManagerName,
      tags: tags || [],
      notes,
      organizationId: user.organizationId,
    },
    include: {
      contacts: true,
      balance: true,
      _count: { select: { payments: true, risks: true } },
    },
  })

  // Create default balance record
  await prisma.supplierBalance.create({
    data: { supplierId: supplier.id },
  })

  return NextResponse.json(supplier, { status: 201 })
}