// src/app/api/period-close/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

// GET /api/period-close - List all accounting periods
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const fiscalYear = searchParams.get('fiscalYear');
  const type = searchParams.get('type');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (status) where.status = status;
  if (fiscalYear) where.fiscalYear = parseInt(fiscalYear);
  if (type) where.type = type;

  const periods = await prisma.accountingPeriod.findMany({
    where,
    include: {
      checklistItems: { orderBy: { orderIndex: 'asc' } },
      missingItems: { orderBy: { createdAt: 'desc' } },
      adjustments: { orderBy: { createdAt: 'desc' } },
      auditEntries: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
    orderBy: { startDate: 'desc' },
  });

  return NextResponse.json({ periods });
}

// POST /api/period-close - Create new accounting period
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.name || !body.code || !body.startDate || !body.endDate || !body.fiscalYear) {
    return badRequest('name, code, startDate, endDate, fiscalYear are required');
  }

  // Check for duplicate code
  const existing = await prisma.accountingPeriod.findUnique({
    where: {
      organizationId_code: {
        organizationId: user.organizationId,
        code: body.code,
      },
    },
  });

  if (existing) {
    return badRequest('Period with this code already exists');
  }

  const period = await prisma.accountingPeriod.create({
    data: {
      name: body.name,
      code: body.code,
      type: body.type || 'monthly',
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      fiscalYear: body.fiscalYear,
      fiscalQuarter: body.fiscalQuarter,
      fiscalMonth: body.fiscalMonth,
      status: 'open',
      checklistTotal: 0,
      checklistCompleted: 0,
      checklistProgress: 0,
      notes: body.notes,
      organizationId: user.organizationId,
    },
  });

  // Create audit entry
  await prisma.periodAuditEntry.create({
    data: {
      periodId: period.id,
      action: 'created',
      description: `Period ${period.name} created`,
      userId: user.id!,
      userName: user.name,
    },
  });

  return NextResponse.json(period, { status: 201 });
}