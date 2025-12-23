// src/app/api/scenarios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const caseType = searchParams.get('caseType');
  const visibility = searchParams.get('visibility');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  
  if (status) where.status = status;
  if (caseType) where.caseType = caseType;
  if (visibility) {
    // Show personal scenarios only for owner, team/org_wide for all
    where.OR = [
      { visibility: 'org_wide' },
      { visibility: 'team' },
      { visibility: 'personal', ownerId: user.id },
    ];
  }

  const scenarios = await prisma.scenario.findMany({
    where,
    include: {
      assumptions: { orderBy: { category: 'asc' } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ scenarios });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.name) return badRequest('Scenario name is required');

  // Default metrics structure
  const defaultMetrics = {
    revenue: 0,
    costs: 0,
    cash: 0,
    netPosition: 0,
    profitMargin: 0,
    cashRunwayDays: 0,
    revenueDelta: 0,
    costsDelta: 0,
    cashDelta: 0,
    netDelta: 0,
    revenueChangePercent: 0,
    costsChangePercent: 0,
    cashChangePercent: 0,
    netChangePercent: 0,
  };

  const scenario = await prisma.scenario.create({
    data: {
      name: body.name,
      description: body.description,
      caseType: body.caseType || 'custom',
      status: 'draft',
      visibility: body.visibility || 'personal',
      metrics: body.metrics || defaultMetrics,
      confidenceLevel: body.confidenceLevel || 'medium',
      confidenceScore: body.confidenceScore || 50,
      uncertaintyBandLow: body.uncertaintyBandLow,
      uncertaintyBandHigh: body.uncertaintyBandHigh,
      derivedFromId: body.derivedFromId,
      derivedFromName: body.derivedFromName,
      ownerId: user.id,
      ownerName: user.name || 'Unknown',
      sharedWithTeams: body.sharedWithTeams || [],
      tags: body.tags || [],
      createdBy: user.name || user.id,
      organizationId: user.organizationId,
    },
    include: { assumptions: true },
  });

  // Log creation event
  await prisma.scenarioChangeEvent.create({
    data: {
      scenarioId: scenario.id,
      changeType: 'created',
      description: `Scenario "${scenario.name}" created`,
      userId: user.id,
      userName: user.name || 'Unknown',
    },
  });

  return NextResponse.json(scenario, { status: 201 });
}