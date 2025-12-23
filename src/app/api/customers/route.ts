import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/customers
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const riskLevel = searchParams.get('riskLevel')
  const search = searchParams.get('search')

  const where: Record<string, unknown> = { organizationId: user.organizationId }
  if (status && status !== 'all') where.status = status
  if (type && type !== 'all') where.type = type
  if (riskLevel && riskLevel !== 'all') where.riskLevel = riskLevel
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { customerNumber: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      contacts: { where: { isPrimary: true }, take: 1 },
      _count: { select: { payments: true, riskIndicators: true } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ customers })
}

// POST /api/customers
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const body = await req.json()
  const {
    name,
    type = 'business',
    status = 'active',
    industry,
    email,
    phone,
    website,
    address,
    taxId,
    vatNumber,
    creditLimit = 0,
    paymentTerms = 'Net 30',
    accountManagerName,
    tags,
    notes,
  } = body

  if (!name) {
    return badRequest('Customer name is required')
  }

  const count = await prisma.customer.count({
    where: { organizationId: user.organizationId },
  })
  const customerNumber = `C-${10001 + count}`

  const customer = await prisma.customer.create({
    data: {
      customerNumber,
      name,
      type,
      status,
      industry,
      email,
      phone,
      website,
      address,
      taxId,
      vatNumber,
      creditLimit,
      creditAvailable: creditLimit,
      paymentTerms,
      accountManagerName,
      tags: tags || [],
      notes,
      organizationId: user.organizationId,
    },
    include: {
      contacts: true,
      _count: { select: { payments: true, riskIndicators: true } },
    },
  })

  return NextResponse.json(customer, { status: 201 })
}