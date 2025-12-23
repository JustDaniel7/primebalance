// =============================================================================
// SECTION 1: src/app/api/period-close/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/period-close - List all accounting periods
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const fiscalYear = searchParams.get('fiscalYear')
  const type = searchParams.get('type')

  const where: Record<string, unknown> = { organizationId: user.organizationId }
  if (status) where.status = status
  if (fiscalYear) where.fiscalYear = parseInt(fiscalYear)
  if (type) where.type = type

  const periods = await prisma.accountingPeriod.findMany({
    where,
    include: {
      checklistItems: { orderBy: { orderIndex: 'asc' } },
      missingItems: { orderBy: { createdAt: 'desc' } },
      adjustments: { orderBy: { createdAt: 'desc' } },
      auditEntries: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
    orderBy: { startDate: 'desc' },
  })

  return NextResponse.json({ periods })
}

// POST /api/period-close - Create new accounting period
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const body = await req.json()
  const {
    name,
    code,
    type = 'monthly',
    startDate,
    endDate,
    fiscalYear,
    fiscalQuarter,
    fiscalMonth,
    notes,
  } = body

  if (!name || !code || !startDate || !endDate || !fiscalYear) {
    return badRequest('Missing required fields: name, code, startDate, endDate, fiscalYear')
  }

  // Check for duplicate code
  const existing = await prisma.accountingPeriod.findUnique({
    where: {
      organizationId_code: {
        organizationId: user.organizationId,
        code,
      },
    },
  })

  if (existing) {
    return badRequest(`Period with code ${code} already exists`)
  }

  const period = await prisma.accountingPeriod.create({
    data: {
      name,
      code,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      fiscalYear,
      fiscalQuarter,
      fiscalMonth,
      status: 'open',
      checklistTotal: 0,
      checklistCompleted: 0,
      checklistProgress: 0,
      hasUnreconciledItems: false,
      hasPendingTransactions: false,
      hasMissingDocuments: false,
      hasUnapprovedAdjustments: false,
      notes,
      organizationId: user.organizationId,
      auditEntries: {
        create: {
          action: 'created',
          description: `Period ${name} created`,
          userId: user.id,
          userName: user.name || undefined,
        },
      },
    },
    include: {
      checklistItems: true,
      missingItems: true,
      adjustments: true,
      auditEntries: true,
    },
  })

  return NextResponse.json(period, { status: 201 })
}
