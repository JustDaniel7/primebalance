// src/app/api/kpis/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const dismissed = searchParams.get('dismissed') === 'true';
  const severity = searchParams.get('severity');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (!dismissed) where.isDismissed = false;
  if (severity) where.severity = severity;

  const alerts = await prisma.kPIAlert.findMany({
    where,
    include: { kpi: { select: { code: true, name: true, category: true } } },
    orderBy: [{ severity: 'desc' }, { triggeredAt: 'desc' }],
  });

  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.kpiId || !body.type || !body.title || !body.message) {
    return badRequest('kpiId, type, title, and message are required');
  }

  const alert = await prisma.kPIAlert.create({
    data: {
      kpiId: body.kpiId,
      organizationId: user.organizationId,
      type: body.type,
      severity: body.severity || 'warning',
      title: body.title,
      message: body.message,
      currentValue: body.currentValue || 0,
      threshold: body.threshold,
      deviation: body.deviation,
      suggestedAction: body.suggestedAction,
    },
  });

  return NextResponse.json(alert, { status: 201 });
}