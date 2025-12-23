import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils'

// =============================================================================
// SECTION 4: src/app/api/period-close/[id]/checklist/[itemId]/route.ts
// =============================================================================

// PATCH /api/period-close/[id]/checklist/[itemId]
export async function PATCH_CHECKLIST_ITEM(
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

  const current = await prisma.closeChecklistItem.findFirst({
    where: { id: itemId, periodId: id },
  })
  if (!current) return notFound('Checklist item not found')

  const previousStatus = current.status
  const newStatus = body.status

  const updateData: Record<string, unknown> = { ...body }

  if (newStatus && newStatus !== previousStatus) {
    if (newStatus === 'completed') {
      updateData.completedAt = new Date()
      updateData.completedBy = user.id
    } else if (previousStatus === 'completed') {
      updateData.completedAt = null
      updateData.completedBy = null
    }
  }

  const result = await prisma.closeChecklistItem.update({
    where: { id: itemId },
    data: updateData,
  })

  const [total, completed] = await Promise.all([
    prisma.closeChecklistItem.count({ where: { periodId: id } }),
    prisma.closeChecklistItem.count({ where: { periodId: id, status: 'completed' } }),
  ])

  const progress = total > 0 ? (completed / total) * 100 : 0

  await prisma.accountingPeriod.update({
    where: { id },
    data: {
      checklistTotal: total,
      checklistCompleted: completed,
      checklistProgress: progress,
    },
  })

  if (newStatus && newStatus !== previousStatus) {
    await prisma.periodAuditEntry.create({
      data: {
        periodId: id,
        action: 'checklist_updated',
        description: `${newStatus === 'completed' ? 'Completed' : newStatus === 'skipped' ? 'Skipped' : 'Updated'}: ${current.name}`,
        userId: user.id,
        userName: user.name || undefined,
        metadata: { itemId, previousStatus, newStatus },
      },
    })
  }

  return NextResponse.json(result)
}
