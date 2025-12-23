// src/app/api/forecasts/cash/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const version = searchParams.get('version') || 'latest';
  const scenarioId = searchParams.get('scenarioId');

  const where: Record<string, unknown> = { organizationId: user.organizationId, version };
  if (scenarioId) where.scenarioId = scenarioId;

  const forecast = await prisma.cashForecast.findFirst({
    where,
    include: {
      periods: { orderBy: { startDate: 'asc' } },
      annotations: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(forecast);
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  const forecast = await prisma.cashForecast.create({
    data: {
      version: body.version || 'latest',
      scenarioId: body.scenarioId,
      timeHorizon: body.timeHorizon || 'quarter',
      granularity: body.granularity || 'monthly',
      currency: body.currency || 'EUR',
      currentCashBalance: body.currentCashBalance || 0,
      minimumCashRunway: body.minimumCashRunway || 0,
      covenantThreshold: body.covenantThreshold || 0,
      projectedMinimumBalance: body.projectedMinimumBalance || 0,
      projectedMinimumDate: body.projectedMinimumDate ? new Date(body.projectedMinimumDate) : null,
      avgCollectionDays: body.avgCollectionDays || 30,
      avgPaymentTerms: body.avgPaymentTerms || 30,
      delayedReceivables: body.delayedReceivables || 0,
      stressScenarios: body.stressScenarios || [],
      dataSource: body.dataSource,
      confidence: body.confidence || 'medium',
      lastUpdatedBy: user.name || user.id,
      organizationId: user.organizationId,
    },
    include: { periods: true },
  });

  return NextResponse.json(forecast, { status: 201 });
}