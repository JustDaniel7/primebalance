import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils'

// =============================================================================
// SECTION 7: src/app/api/period-close/adjustments/route.ts
// =============================================================================

// GET /api/period-close/adjustments
export async function GET_ADJUSTMENTS(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { searchParams } = new URL(req.url)
  const periodId = searchParams.get('periodId')
  const status = searchParams.get('status')
  const type = searchParams.get('type')

  const where: Record<string, unknown> = { organizationId: user.organizationId }
  if (periodId) where.periodId = periodId
  if (status) where.status = status
  if (type) where.type = type

  const adjustments = await prisma.periodAdjustment.findMany({
    where,
    include: { period: { select: { name: true, code: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ adjustments })
}

// POST /api/period-close/adjustments
export async function POST_ADJUSTMENT(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const body = await req.json()
  const {
    periodId,
    type = 'accrual',
    description,
    reason,
    debitAccountId,
    debitAccountName,
    creditAccountId,
    creditAccountName,
    amount,
    currency = 'EUR',
    effectiveDate,
    isReversing = false,
    reversalDate,
    reversalPeriodId,
    notes,
  } = body

  if (!periodId || !description || !reason || !amount || !effectiveDate) {
    return badRequest('periodId, description, reason, amount, and effectiveDate are required')
  }

  const period = await prisma.accountingPeriod.findFirst({
    where: { id: periodId, organizationId: user.organizationId },
  })
  if (!period) {
    return badRequest('Period not found')
  }

  const count = await prisma.periodAdjustment.count({
    where: { organizationId: user.organizationId },
  })
  const adjustmentNumber = `ADJ-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

  const adjustment = await prisma.periodAdjustment.create({
    data: {
      periodId,
      adjustmentNumber,
      type,
      status: 'draft',
      description,
      reason,
      debitAccountId,
      debitAccountName,
      creditAccountId,
      creditAccountName,
      amount,
      currency,
      effectiveDate: new Date(effectiveDate),
      isReversing,
      reversalDate: reversalDate ? new Date(reversalDate) : null,
      reversalPeriodId,
      requestedBy: user.id,
      requestedByName: user.name || undefined,
      notes,
      organizationId: user.organizationId,
    },
    include: { period: { select: { name: true, code: true } } },
  })

  await prisma.accountingPeriod.update({
    where: { id: periodId },
    data: { hasUnapprovedAdjustments: true },
  })

  return NextResponse.json(adjustment, { status: 201 })
}
