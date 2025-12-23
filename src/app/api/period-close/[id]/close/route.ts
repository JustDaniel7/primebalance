// src/app/api/period-close/[id]/close/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

// POST /api/period-close/[id]/close - Close the period
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      checklistItems: true,
      missingItems: { where: { status: { in: ['open', 'in_progress'] } } },
      adjustments: { where: { status: { in: ['draft', 'pending_approval'] } } },
    },
  });

  if (!period) return notFound('Accounting Period');

  if (period.status !== 'closing') {
    return badRequest('Period must be in closing status to close');
  }

  // Check blockers unless force close
  if (!body.force) {
    const criticalIncomplete = period.checklistItems.filter(
      (i) => i.isCritical && i.status !== 'completed' && i.status !== 'skipped'
    );

    if (criticalIncomplete.length > 0) {
      return badRequest(`Cannot close: ${criticalIncomplete.length} critical checklist items incomplete`);
    }

    const criticalMissing = period.missingItems.filter((i) => i.severity === 'critical');
    if (criticalMissing.length > 0) {
      return badRequest(`Cannot close: ${criticalMissing.length} critical missing items unresolved`);
    }

    if (period.adjustments.length > 0) {
      return badRequest(`Cannot close: ${period.adjustments.length} unapproved/unposted adjustments`);
    }
  }

  const updated = await prisma.accountingPeriod.update({
    where: { id },
    data: {
      status: 'closed',
      closedAt: new Date(),
      closedBy: user.name || user.id,
      totalRevenue: body.totalRevenue,
      totalExpenses: body.totalExpenses,
      netIncome: body.netIncome,
      totalAssets: body.totalAssets,
      totalLiabilities: body.totalLiabilities,
    },
  });

  // Audit entry
  await prisma.periodAuditEntry.create({
    data: {
      periodId: id,
      action: 'closed',
      description: `Period ${period.name} closed${body.force ? ' (forced)' : ''}`,
      userId: user.id!,
      userName: user.name,
      previousStatus: 'closing',
      newStatus: 'closed',
      metadata: { forced: body.force || false },
    },
  });

  return NextResponse.json(updated);
}