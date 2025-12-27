// src/app/api/liquidity/gaps/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (status) where.status = status;

  const gaps = await prisma.liquidityGap.findMany({
    where,
    orderBy: { startDate: 'asc' },
  });

  return NextResponse.json({ gaps });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.startDate || !body.endDate || body.peakDeficit === undefined) {
    return badRequest('startDate, endDate, and peakDeficit are required');
  }

  const startDate = new Date(body.startDate);
  const endDate = new Date(body.endDate);
  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const gap = await prisma.liquidityGap.create({
    data: {
      startDate,
      endDate,
      durationDays,
      peakDeficit: body.peakDeficit,
      averageDeficit: body.averageDeficit || body.peakDeficit,
      totalDeficitDays: body.totalDeficitDays || body.peakDeficit * durationDays,
      currency: body.currency || 'EUR',
      causes: body.causes || [],
      affectedPeriods: body.affectedPeriods || [],
      severity: body.severity || 'moderate',
      status: 'projected',
      scenarioId: body.scenarioId,
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(gap, { status: 201 });
}