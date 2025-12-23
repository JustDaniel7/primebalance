// src/app/api/period-close/[id]/lock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

// POST /api/period-close/[id]/lock - Lock a closed period
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!period) return notFound('Accounting Period');

  if (period.status !== 'closed') {
    return badRequest('Only closed periods can be locked');
  }

  const updated = await prisma.accountingPeriod.update({
    where: { id },
    data: { status: 'locked' },
  });

  // Audit entry
  await prisma.periodAuditEntry.create({
    data: {
      periodId: id,
      action: 'locked',
      description: `Period ${period.name} locked`,
      userId: user.id!,
      userName: user.name,
      previousStatus: 'closed',
      newStatus: 'locked',
    },
  });

  return NextResponse.json(updated);
}