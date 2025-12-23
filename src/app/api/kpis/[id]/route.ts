// src/app/api/kpis/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const kpi = await prisma.kPI.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      history: { orderBy: { periodStart: 'desc' }, take: 24 },
      alerts: { orderBy: { triggeredAt: 'desc' }, take: 10 },
      targets: { orderBy: { periodStart: 'desc' } },
      benchmarks: { where: { isActive: true } },
    },
  });

  if (!kpi) return notFound('KPI');
  return NextResponse.json(kpi);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.kPI.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('KPI');

  // Calculate status and trend if value changed
  let updates: Record<string, any> = { ...body };

  if (body.currentValue !== undefined) {
    const current = Number(body.currentValue);
    const previous = body.previousValue !== undefined ? Number(body.previousValue) : Number(existing.previousValue);
    const target = body.targetValue !== undefined ? Number(body.targetValue) : (existing.targetValue ? Number(existing.targetValue) : undefined);
    const higherIsBetter = body.higherIsBetter ?? existing.higherIsBetter;

    // Calculate deltas
    updates.deltaVsPrior = current - previous;
    updates.deltaVsPriorPercent = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
    if (target !== undefined) {
      updates.deltaVsTarget = current - target;
      updates.deltaVsTargetPercent = target !== 0 ? ((current - target) / target) * 100 : 0;
    }

    // Calculate status
    if (target !== undefined) {
      const ratio = current / target;
      if (higherIsBetter) {
        updates.status = ratio >= 0.95 ? 'on_track' : ratio >= 0.85 ? 'watch' : 'off_track';
      } else {
        updates.status = ratio <= 1.05 ? 'on_track' : ratio <= 1.15 ? 'watch' : 'off_track';
      }
    }

    // Calculate trend
    if (previous !== 0) {
      const changePercent = ((current - previous) / previous) * 100;
      if (higherIsBetter) {
        updates.trend = changePercent >= 2 ? 'improving' : changePercent <= -2 ? 'deteriorating' : 'stable';
      } else {
        updates.trend = changePercent <= -2 ? 'improving' : changePercent >= 2 ? 'deteriorating' : 'stable';
      }
    }

    updates.lastCalculatedAt = new Date();
  }

  const updated = await prisma.kPI.update({
    where: { id },
    data: updates,
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const existing = await prisma.kPI.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('KPI');

  await prisma.kPI.delete({ where: { id } });

  return NextResponse.json({ success: true });
}