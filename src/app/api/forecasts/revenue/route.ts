// src/app/api/forecasts/revenue/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const version = searchParams.get('version') || 'latest';
  const scenarioId = searchParams.get('scenarioId');

  const where: Record<string, unknown> = { organizationId: user.organizationId, version };
  if (scenarioId) where.scenarioId = scenarioId;

  const forecast = await prisma.revenueForecast.findFirst({
    where,
    include: {
      lineItems: { orderBy: { createdAt: 'asc' } },
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

  const forecast = await prisma.revenueForecast.create({
    data: {
      version: body.version || 'latest',
      scenarioId: body.scenarioId,
      timeHorizon: body.timeHorizon || 'quarter',
      granularity: body.granularity || 'monthly',
      currency: body.currency || 'EUR',
      totalExpected: body.totalExpected || 0,
      totalBestCase: body.totalBestCase || 0,
      totalWorstCase: body.totalWorstCase || 0,
      committedRevenue: body.committedRevenue || 0,
      projectedRevenue: body.projectedRevenue || 0,
      atRiskRevenue: body.atRiskRevenue || 0,
      byProduct: body.byProduct || {},
      bySegment: body.bySegment || {},
      byRegion: body.byRegion || {},
      byType: body.byType || {},
      dataSource: body.dataSource,
      confidence: body.confidence || 'medium',
      lastUpdatedBy: user.name || user.id,
      organizationId: user.organizationId,
    },
    include: { lineItems: true },
  });

  return NextResponse.json(forecast, { status: 201 });
}