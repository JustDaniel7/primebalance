// src/app/api/fx/scenarios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const scenarios = await prisma.fXScenario.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ scenarios });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.name) return badRequest('Scenario name is required');

  const scenario = await prisma.fXScenario.create({
    data: {
      name: body.name,
      description: body.description,
      baseCurrency: body.baseCurrency || 'EUR',
      rateAssumptions: body.rateAssumptions || [],
      totalExposureImpact: body.totalExposureImpact || 0,
      revenueImpact: body.revenueImpact || 0,
      costImpact: body.costImpact || 0,
      cashImpact: body.cashImpact || 0,
      scenarioType: body.scenarioType || 'sensitivity',
      severity: body.severity || 'moderate',
      probability: body.probability,
      isActive: true,
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(scenario, { status: 201 });
}