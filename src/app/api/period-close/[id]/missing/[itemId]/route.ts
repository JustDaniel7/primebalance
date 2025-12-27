// src/app/api/period-close/[id]/missing/[itemId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string; itemId: string }> };

// PATCH /api/period-close/[id]/missing/[itemId]
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id, itemId } = await params;
  const body = await req.json();

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!period) return notFound('Period');

  const updated = await prisma.periodMissingItem.update({
    where: { id: itemId },
    data: {
      status: body.status,
      resolvedAt: body.status === 'resolved' ? new Date() : undefined,
      resolvedBy: body.status === 'resolved' ? user.name : undefined,
      resolution: body.resolution,
      waivedReason: body.waivedReason,
      assignedTo: body.assignedTo,
      assignedToName: body.assignedToName,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    },
  });

  // Check if any missing items remain open
  const openMissing = await prisma.periodMissingItem.count({
    where: { periodId: id, status: { in: ['open', 'in_progress'] } },
  });

  await prisma.accountingPeriod.update({
    where: { id },
    data: { hasMissingDocuments: openMissing > 0 },
  });

  return NextResponse.json(updated);
}

// DELETE /api/period-close/[id]/missing/[itemId]
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id, itemId } = await params;

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!period) return notFound('Period');

  await prisma.periodMissingItem.delete({ where: { id: itemId } });

  return NextResponse.json({ success: true });
}