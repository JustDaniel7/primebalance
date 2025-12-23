import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils'

// =============================================================================
// SECTION 6: src/app/api/period-close/[id]/missing/[itemId]/route.ts
// =============================================================================

// PATCH /api/period-close/[id]/missing/[itemId]
export async function PATCH_MISSING_ITEM(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id, itemId } = await params
  const body = await req.json()

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!period) return notFound('Period not found')

  const current = await prisma.periodMissingItem.findFirst({
    where: { id: itemId, periodId: id },
  })
  if (!current) return notFound('Missing item not found')

  const updateData: Record<string, unknown> = { ...body }

  if (body.status === 'resolved' && current.status !== 'resolved') {
    if (!body.resolution) {
      return badRequest('Resolution description is required')
    }
    updateData.resolvedAt = new Date()
    updateData.resolvedBy = user.id
  }

  if (body.status === 'waived' && current.status !== 'waived') {
    if (!body.waivedReason) {
      return badRequest('Waive reason is required')
    }
  }

  if (body.dueDate) updateData.dueDate = new Date(body.dueDate)

  const result = await prisma.periodMissingItem.update({
    where: { id: itemId },
    data: updateData,
  })

  const openCount = await prisma.periodMissingItem.count({
    where: {
      periodId: id,
      status: { in: ['open', 'in_progress'] },
    },
  })

  await prisma.accountingPeriod.update({
    where: { id },
    data: { hasMissingDocuments: openCount > 0 },
  })

  return NextResponse.json(result)
}
