// =============================================================================
// SECTION 2: src/app/api/period-close/[id]/route.ts
// =============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils'

// GET /api/period-close/[id] - Get single period with all related data
export async function GET_PERIOD(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      checklistItems: { orderBy: { orderIndex: 'asc' } },
      missingItems: { orderBy: { createdAt: 'desc' } },
      adjustments: { orderBy: { createdAt: 'desc' } },
      auditEntries: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!period) return notFound('Period not found')

  return NextResponse.json(period)
}

// PATCH /api/period-close/[id] - Update period (including status transitions)
export async function PATCH_PERIOD(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params
  const body = await req.json()

  const current = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!current) return notFound('Period not found')

  const previousStatus = current.status
  const newStatus = body.status

  const updateData: Record<string, unknown> = { ...body }

  if (newStatus && newStatus !== previousStatus) {
    switch (newStatus) {
      case 'closing':
        if (previousStatus !== 'open' && previousStatus !== 'reopened') {
          return badRequest('Can only start closing from open or reopened status')
        }
        break

      case 'closed':
        if (previousStatus !== 'closing') {
          return badRequest('Can only close from closing status')
        }
        updateData.closedAt = new Date()
        updateData.closedBy = user.id
        break

      case 'locked':
        if (previousStatus !== 'closed') {
          return badRequest('Can only lock from closed status')
        }
        break

      case 'reopened':
        if (previousStatus !== 'closed' && previousStatus !== 'locked') {
          return badRequest('Can only reopen from closed or locked status')
        }
        if (!body.reopenReason) {
          return badRequest('Reopen reason is required')
        }
        updateData.reopenedAt = new Date()
        updateData.reopenedBy = user.id
        updateData.reopenReason = body.reopenReason
        break
    }
  }

  if (body.startDate) updateData.startDate = new Date(body.startDate)
  if (body.endDate) updateData.endDate = new Date(body.endDate)

  const result = await prisma.accountingPeriod.update({
    where: { id },
    data: updateData,
    include: {
      checklistItems: { orderBy: { orderIndex: 'asc' } },
      missingItems: { orderBy: { createdAt: 'desc' } },
      adjustments: { orderBy: { createdAt: 'desc' } },
      auditEntries: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (newStatus && newStatus !== previousStatus) {
    await prisma.periodAuditEntry.create({
      data: {
        periodId: id,
        action: newStatus === 'closing' ? 'closing_started' : newStatus,
        description: `Period status changed from ${previousStatus} to ${newStatus}`,
        userId: user.id,
        userName: user.name || undefined,
        previousStatus,
        newStatus,
      },
    })
  }

  return NextResponse.json(result)
}

// DELETE /api/period-close/[id] - Delete period (only if open/draft)
export async function DELETE_PERIOD(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
  })

  if (!period) return notFound('Period not found')

  if (period.status !== 'open') {
    return badRequest('Can only delete periods in open status')
  }

  await prisma.accountingPeriod.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
