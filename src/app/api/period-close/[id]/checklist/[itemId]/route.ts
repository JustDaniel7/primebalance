// src/app/api/period-close/[id]/checklist/[itemId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string; itemId: string }> };

// PATCH /api/period-close/[id]/checklist/[itemId]
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id, itemId } = await params;
  const body = await req.json();

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!period) return notFound('Period');

  const existing = await prisma.closeChecklistItem.findFirst({
    where: { id: itemId, periodId: id },
  });
  if (!existing) return notFound('Checklist Item');

  const wasCompleted = existing.status === 'completed';
  const willBeCompleted = body.status === 'completed';

  const updated = await prisma.closeChecklistItem.update({
    where: { id: itemId },
    data: {
      status: body.status,
      completedAt: willBeCompleted && !wasCompleted ? new Date() : body.status === 'pending' ? null : undefined,
      completedBy: willBeCompleted && !wasCompleted ? user.name : body.status === 'pending' ? null : undefined,
      notes: body.notes,
      autoCheckResult: body.autoCheckResult,
      lastAutoCheck: body.lastAutoCheck ? new Date(body.lastAutoCheck) : undefined,
    },
  });

  // Update period progress
  const allItems = await prisma.closeChecklistItem.findMany({
    where: { periodId: id },
  });
  const completed = allItems.filter((i) => i.status === 'completed' || i.status === 'skipped').length;
  const progress = allItems.length > 0 ? Math.round((completed / allItems.length) * 100) : 0;

  await prisma.accountingPeriod.update({
    where: { id },
    data: {
      checklistCompleted: completed,
      checklistProgress: progress,
    },
  });

  // Audit entry
  if (body.status && body.status !== existing.status) {
    await prisma.periodAuditEntry.create({
      data: {
        periodId: id,
        action: 'checklist_updated',
        description: `Checklist item "${existing.name}" status changed to ${body.status}`,
        userId: user.id!,
        userName: user.name,
        metadata: { itemId, itemName: existing.name, newStatus: body.status },
      },
    });
  }

  return NextResponse.json(updated);
}

// DELETE /api/period-close/[id]/checklist/[itemId]
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id, itemId } = await params;

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!period) return notFound('Period');

  await prisma.closeChecklistItem.delete({ where: { id: itemId } });

  // Update period total
  await prisma.accountingPeriod.update({
    where: { id },
    data: { checklistTotal: { decrement: 1 } },
  });

  return NextResponse.json({ success: true });
}