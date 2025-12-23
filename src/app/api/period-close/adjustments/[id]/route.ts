import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils'

// =============================================================================
// SECTION 8: src/app/api/period-close/adjustments/[id]/route.ts
// =============================================================================

// GET /api/period-close/adjustments/[id]
export async function GET_ADJUSTMENT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params

  const adjustment = await prisma.periodAdjustment.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { period: { select: { name: true, code: true, status: true } } },
  })

  if (!adjustment) return notFound('Adjustment not found')

  return NextResponse.json(adjustment)
}

// PATCH /api/period-close/adjustments/[id]
export async function PATCH_ADJUSTMENT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params
  const body = await req.json()

  const current = await prisma.periodAdjustment.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!current) return notFound('Adjustment not found')

  const previousStatus = current.status
  const newStatus = body.status

  const updateData: Record<string, unknown> = { ...body }

  if (newStatus && newStatus !== previousStatus) {
    switch (newStatus) {
      case 'pending_approval':
        if (previousStatus !== 'draft') {
          return badRequest('Can only submit for approval from draft status')
        }
        break

      case 'approved':
        if (previousStatus !== 'pending_approval') {
          return badRequest('Can only approve from pending_approval status')
        }
        updateData.approvedBy = user.id
        updateData.approvedByName = user.name || undefined
        updateData.approvedAt = new Date()
        break

      case 'rejected':
        if (previousStatus !== 'pending_approval') {
          return badRequest('Can only reject from pending_approval status')
        }
        if (!body.rejectionReason) {
          return badRequest('Rejection reason is required')
        }
        updateData.rejectedBy = user.id
        break

      case 'posted':
        if (previousStatus !== 'approved') {
          return badRequest('Can only post from approved status')
        }
        updateData.postedAt = new Date()
        updateData.journalEntryId = `JE-${Date.now()}`
        break

      case 'draft':
        if (previousStatus !== 'pending_approval') {
          return badRequest('Can only revert to draft from pending_approval status')
        }
        break
    }
  }

  if (body.effectiveDate) updateData.effectiveDate = new Date(body.effectiveDate)
  if (body.reversalDate) updateData.reversalDate = new Date(body.reversalDate)

  const result = await prisma.periodAdjustment.update({
    where: { id },
    data: updateData,
    include: { period: { select: { name: true, code: true } } },
  })

  const unapprovedCount = await prisma.periodAdjustment.count({
    where: {
      periodId: current.periodId,
      status: { in: ['draft', 'pending_approval', 'approved'] },
    },
  })

  await prisma.accountingPeriod.update({
    where: { id: current.periodId },
    data: { hasUnapprovedAdjustments: unapprovedCount > 0 },
  })

  if (newStatus && newStatus !== previousStatus) {
    await prisma.periodAuditEntry.create({
      data: {
        periodId: current.periodId,
        action: newStatus === 'posted' ? 'adjustment_posted' : 'checklist_updated',
        description: `Adjustment ${current.adjustmentNumber} ${newStatus}`,
        userId: user.id,
        userName: user.name || undefined,
        metadata: { adjustmentId: id, previousStatus, newStatus },
      },
    })
  }

  return NextResponse.json(result)
}

// DELETE /api/period-close/adjustments/[id]
export async function DELETE_ADJUSTMENT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params

  const adjustment = await prisma.periodAdjustment.findFirst({
    where: { id, organizationId: user.organizationId },
  })

  if (!adjustment) return notFound('Adjustment not found')

  if (adjustment.status !== 'draft') {
    return badRequest('Can only delete adjustments in draft status')
  }

  await prisma.periodAdjustment.delete({ where: { id } })

  const unapprovedCount = await prisma.periodAdjustment.count({
    where: {
      periodId: adjustment.periodId,
      status: { in: ['draft', 'pending_approval', 'approved'] },
    },
  })

  await prisma.accountingPeriod.update({
    where: { id: adjustment.periodId },
    data: { hasUnapprovedAdjustments: unapprovedCount > 0 },
  })

  return NextResponse.json({ success: true })
}
