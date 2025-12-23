// src/app/api/forecasts/scenarios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const scenarios = await prisma.forecastScenario.findMany({
    where: { organizationId: user.organizationId },
    include: { assumptions: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ scenarios });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.name) return badRequest('Scenario name is required');

  const scenario = await prisma.forecastScenario.create({
    data: {
      name: body.name,
      type: body.type || 'custom',
      description: body.description,
      revenueForecastId: body.revenueForecastId,
      costForecastId: body.costForecastId,
      cashForecastId: body.cashForecastId,
      revenueVsBase: body.revenueVsBase || 0,
      costVsBase: body.costVsBase || 0,
      cashVsBase: body.cashVsBase || 0,
      netVsBase: body.netVsBase || 0,
      isLocked: false,
      isActive: true,
      createdBy: user.name || user.id,
      organizationId: user.organizationId,
    },
    include: { assumptions: true },
  });

  return NextResponse.json(scenario, { status: 201 });
}