// src/app/api/forecasts/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const severity = searchParams.get('severity');

  const where: Record<string, unknown> = {
    organizationId: user.organizationId,
    isDismissed: false,
  };
  if (unreadOnly) where.isRead = false;
  if (severity) where.severity = severity;

  const alerts = await prisma.forecastAlert.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  const alert = await prisma.forecastAlert.create({
    data: {
      type: body.type,
      severity: body.severity || 'medium',
      title: body.title,
      message: body.message,
      forecastType: body.forecastType,
      periodId: body.periodId,
      lineItemId: body.lineItemId,
      threshold: body.threshold,
      currentValue: body.currentValue,
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(alert, { status: 201 });
}