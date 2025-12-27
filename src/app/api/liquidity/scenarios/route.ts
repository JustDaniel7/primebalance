// src/app/api/liquidity/scenarios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const active = searchParams.get('active');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (type) where.type = type;
  if (active === 'true') where.isActive = true;

  const scenarios = await prisma.liquidityScenario.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ scenarios });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.name || !body.type || body.startingCashBalance === undefined) {
    return badRequest('name, type, and startingCashBalance are required');
  }

  // Default assumptions based on type
  const defaultAssumptions: Record<string, any> = {
    base: { inflowDelayDays: 0, inflowReductionPercent: 0, outflowAccelerationDays: 0, outflowIncreasePercent: 0, confirmedOnly: false, excludeEstimated: false },
    conservative: { inflowDelayDays: 7, inflowReductionPercent: 10, outflowAccelerationDays: 3, outflowIncreasePercent: 5, confirmedOnly: false, excludeEstimated: true },
    stress: { inflowDelayDays: 14, inflowReductionPercent: 25, outflowAccelerationDays: 7, outflowIncreasePercent: 15, confirmedOnly: true, excludeEstimated: true },
    custom: { inflowDelayDays: 0, inflowReductionPercent: 0, outflowAccelerationDays: 0, outflowIncreasePercent: 0, confirmedOnly: false, excludeEstimated: false },
  };

  const assumptions = body.assumptions || defaultAssumptions[body.type] || defaultAssumptions.base;

  const scenario = await prisma.liquidityScenario.create({
    data: {
      type: body.type,
      name: body.name,
      description: body.description,
      assumptions,
      horizonDays: body.horizonDays || 90,
      timeBucket: body.timeBucket || 'weekly',
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      startingCashBalance: body.startingCashBalance,
      minimumBuffer: body.minimumBuffer || 0,
      currency: body.currency || 'EUR',
      isActive: true,
      isHypothetical: true,
      createdBy: user.name || user.id,
      organizationId: user.organizationId,
    },
  });

  // Log scenario creation
  await prisma.liquidityAuditLog.create({
    data: {
      action: 'scenario_created',
      details: `Created ${body.type} scenario: ${body.name}`,
      userId: user.id,
      userName: user.name,
      scenarioId: scenario.id,
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(scenario, { status: 201 });
}