// src/app/api/liquidity/positions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const periodType = searchParams.get('periodType');
  const limit = parseInt(searchParams.get('limit') || '30');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (periodType) where.periodType = periodType;

  const positions = await prisma.liquidityPosition.findMany({
    where,
    orderBy: { positionDate: 'desc' },
    take: limit,
  });

  return NextResponse.json({ positions });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.positionDate || body.totalCash === undefined) {
    return badRequest('positionDate and totalCash are required');
  }

  // Calculate total liquidity
  const totalLiquidity = (body.totalCash || 0) + (body.availableCredit || 0);

  // Determine status based on metrics
  let status = 'normal';
  const runwayMonths = body.runwayMonths || 0;
  if (runwayMonths < 3) status = 'critical';
  else if (runwayMonths < 6) status = 'warning';
  else if (runwayMonths < 12) status = 'watch';

  const position = await prisma.liquidityPosition.create({
    data: {
      positionDate: new Date(body.positionDate),
      periodType: body.periodType || 'daily',
      totalCash: body.totalCash,
      operatingCash: body.operatingCash || body.totalCash,
      reserveCash: body.reserveCash || 0,
      restrictedCash: body.restrictedCash || 0,
      availableCredit: body.availableCredit || 0,
      totalLiquidity,
      minimumBuffer: body.minimumBuffer || 0,
      expectedInflows: body.expectedInflows || 0,
      expectedOutflows: body.expectedOutflows || 0,
      netCashFlow: (body.expectedInflows || 0) - (body.expectedOutflows || 0),
      projectedEndingCash: body.projectedEndingCash,
      runwayDays: body.runwayDays,
      runwayMonths: body.runwayMonths,
      currentRatio: body.currentRatio,
      quickRatio: body.quickRatio,
      cashBurnRate: body.cashBurnRate,
      status,
      riskLevel: body.riskLevel || 'low',
      dataCompleteness: body.dataCompleteness || 100,
      knownBlindSpots: body.knownBlindSpots,
      accountBreakdown: body.accountBreakdown,
      currency: body.currency || 'EUR',
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(position, { status: 201 });
}