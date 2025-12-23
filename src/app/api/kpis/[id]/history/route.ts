// src/app/api/kpis/[id]/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const periodType = searchParams.get('periodType');
  const limit = parseInt(searchParams.get('limit') || '24');

  const kpi = await prisma.kPI.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!kpi) return notFound('KPI');

  const where: Record<string, unknown> = { kpiId: id };
  if (periodType) where.periodType = periodType;

  const history = await prisma.kPIHistory.findMany({
    where,
    orderBy: { periodStart: 'desc' },
    take: limit,
  });

  return NextResponse.json({ history });
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  if (!body.periodType || !body.periodStart || !body.periodEnd || body.value === undefined) {
    return badRequest('periodType, periodStart, periodEnd, and value are required');
  }

  const kpi = await prisma.kPI.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!kpi) return notFound('KPI');

  // Get previous value for comparison
  const previousEntry = await prisma.kPIHistory.findFirst({
    where: { kpiId: id },
    orderBy: { periodStart: 'desc' },
  });

  const history = await prisma.kPIHistory.create({
    data: {
      kpiId: id,
      periodType: body.periodType,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
      periodLabel: body.periodLabel || formatPeriodLabel(new Date(body.periodStart), body.periodType),
      value: body.value,
      targetValue: body.targetValue,
      previousValue: previousEntry ? Number(previousEntry.value) : null,
      vsTarget: body.targetValue ? body.value - body.targetValue : null,
      vsPrevious: previousEntry ? body.value - Number(previousEntry.value) : null,
      status: body.status,
      trend: body.trend,
      isAnomaly: body.isAnomaly ?? false,
      annotation: body.annotation,
    },
  });

  // Update KPI current value
  await prisma.kPI.update({
    where: { id },
    data: {
      currentValue: body.value,
      previousValue: previousEntry ? Number(previousEntry.value) : kpi.currentValue,
      lastCalculatedAt: new Date(),
    },
  });

  return NextResponse.json(history, { status: 201 });
}

function formatPeriodLabel(date: Date, periodType: string): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const quarter = Math.ceil(month / 3);

  switch (periodType) {
    case 'monthly':
      return `${year}-${String(month).padStart(2, '0')}`;
    case 'quarterly':
      return `Q${quarter} ${year}`;
    case 'yearly':
      return `${year}`;
    default:
      return date.toISOString().split('T')[0];
  }
}