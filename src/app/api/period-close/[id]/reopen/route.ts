// src/app/api/period-close/[id]/reopen/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

// POST /api/period-close/[id]/reopen - Reopen a closed period
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  if (!body.reason) {
    return badRequest('Reason for reopening is required');
  }

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!period) return notFound('Accounting Period');

  if (period.status === 'locked') {
    return badRequest('Cannot reopen a locked period');
  }

  if (period.status !== 'closed') {
    return badRequest('Only closed periods can be reopened');
  }

  const updated = await prisma.accountingPeriod.update({
    where: { id },
    data: {
      status: 'reopened',
      reopenedAt: new Date(),
      reopenedBy: user.name || user.id,
      reopenReason: body.reason,
    },
  });

  // Audit entry
  await prisma.periodAuditEntry.create({
    data: {
      periodId: id,
      action: 'reopened',
      description: `Period ${period.name} reopened: ${body.reason}`,
      userId: user.id!,
      userName: user.name,
      previousStatus: 'closed',
      newStatus: 'reopened',
      metadata: { reason: body.reason },
    },
  });

  return NextResponse.json(updated);
}