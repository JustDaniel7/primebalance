import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils'

// =============================================================================
// SECTION 5: src/app/api/period-close/[id]/missing/route.ts
// =============================================================================

// GET /api/period-close/[id]/missing
export async function GET_MISSING(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const severity = searchParams.get('severity')

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!period) return notFound('Period not found')

  const where: Record<string, unknown> = { periodId: id }
  if (status) where.status = status
  if (severity) where.severity = severity

  const items = await prisma.periodMissingItem.findMany({
    where,
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ missingItems: items })
}

// POST /api/period-close/[id]/missing
export async function POST_MISSING(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params
  const body = await req.json()

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!period) return notFound('Period not found')

  const {
    type,
    severity = 'medium',
    title,
    description,
    reference,
    relatedEntityType,
    relatedEntityId,
    assignedTo,
    assignedToName,
    dueDate,
  } = body

  if (!type || !title || !description) {
    return badRequest('Type, title, and description are required')
  }

  const item = await prisma.periodMissingItem.create({
    data: {
      periodId: id,
      type,
      severity,
      title,
      description,
      reference,
      relatedEntityType,
      relatedEntityId,
      assignedTo,
      assignedToName,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'open',
    },
  })

  await prisma.accountingPeriod.update({
    where: { id },
    data: { hasMissingDocuments: true },
  })

  return NextResponse.json(item, { status: 201 })
}