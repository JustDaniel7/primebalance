// src/app/api/period-close/adjustments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

// GET /api/period-close/adjustments/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const adjustment = await prisma.periodAdjustment.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { period: { select: { name: true, code: true, status: true } } },
  });

  if (!adjustment) return notFound('Adjustment');

  return NextResponse.json(adjustment);
}

// PATCH /api/period-close/adjustments/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.periodAdjustment.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!existing) return notFound('Adjustment');

  // Prevent updates to posted adjustments
  if (existing.status === 'posted' && body.status !== 'reversal') {
    return badRequest('Cannot modify a posted adjustment');
  }

  const updateData: Record<string, unknown> = {};

  // Basic fields
  if (body.description !== undefined) updateData.description = body.description;
  if (body.reason !== undefined) updateData.reason = body.reason;
  if (body.amount !== undefined) updateData.amount = body.amount;
  if (body.effectiveDate !== undefined) updateData.effectiveDate = new Date(body.effectiveDate);
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.supportingDocuments !== undefined) updateData.supportingDocuments = body.supportingDocuments;

  // Status changes
  if (body.status) {
    updateData.status = body.status;

    if (body.status === 'approved') {
      updateData.approvedBy = user.id;
      updateData.approvedByName = user.name;
      updateData.approvedAt = new Date();
    } else if (body.status === 'rejected') {
      updateData.rejectedBy = user.id;
      updateData.rejectionReason = body.rejectionReason;
    } else if (body.status === 'posted') {
      updateData.postedAt = new Date();
      updateData.journalEntryId = body.journalEntryId || `JE-${Date.now()}`;
    }
  }

  const updated = await prisma.periodAdjustment.update({
    where: { id },
    data: updateData,
  });

  // Update period flag if all adjustments are now posted/rejected
  if (body.status === 'posted' || body.status === 'rejected') {
    const pendingAdjustments = await prisma.periodAdjustment.count({
      where: {
        periodId: existing.periodId,
        status: { in: ['draft', 'pending_approval', 'approved'] },
      },
    });

    await prisma.accountingPeriod.update({
      where: { id: existing.periodId },
      data: { hasUnapprovedAdjustments: pendingAdjustments > 0 },
    });
  }

  // Audit entry for status changes
  if (body.status && body.status !== existing.status) {
    await prisma.periodAuditEntry.create({
      data: {
        periodId: existing.periodId,
        action: body.status === 'posted' ? 'adjustment_posted' : 'checklist_updated',
        description: `Adjustment ${existing.adjustmentNumber} ${body.status}`,
        userId: user.id!,
        userName: user.name,
        metadata: { adjustmentId: id, adjustmentNumber: existing.adjustmentNumber, newStatus: body.status },
      },
    });
  }

  return NextResponse.json(updated);
}

// DELETE /api/period-close/adjustments/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const existing = await prisma.periodAdjustment.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!existing) return notFound('Adjustment');

  if (existing.status === 'posted') {
    return badRequest('Cannot delete a posted adjustment');
  }

  await prisma.periodAdjustment.delete({ where: { id } });

  return NextResponse.json({ success: true });
}