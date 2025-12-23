// src/app/api/fx/scenarios/[id]/run/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const scenario = await prisma.fXScenario.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!scenario) return notFound('FX Scenario');

  // Get current exposures
  const exposures = await prisma.fXExposure.findMany({
    where: { organizationId: user.organizationId, status: { not: 'closed' } },
  });

  // Calculate impact based on rate assumptions
  const rateAssumptions = scenario.rateAssumptions as Array<{
    currency: string;
    currentRate: number;
    scenarioRate: number;
    changePercent: number;
  }>;

  let totalImpact = 0;
  let revenueImpact = 0;
  let costImpact = 0;

  for (const exposure of exposures) {
    const assumption = rateAssumptions.find((a) => a.currency === exposure.quoteCurrency);
    if (assumption) {
      const impactPercent = assumption.changePercent / 100;
      const exposureImpact = Number(exposure.unhedgedAmount) * impactPercent;
      totalImpact += exposureImpact;

      if (exposure.direction === 'inflow') {
        revenueImpact += exposureImpact;
      } else {
        costImpact += exposureImpact;
      }
    }
  }

  // Update scenario with calculated impacts
  const updated = await prisma.fXScenario.update({
    where: { id },
    data: {
      totalExposureImpact: totalImpact,
      revenueImpact,
      costImpact,
      cashImpact: revenueImpact - costImpact,
    },
  });

  // Log scenario run
  await prisma.fXAuditLog.create({
    data: {
      action: 'scenario_run',
      category: 'scenario',
      details: `Scenario "${scenario.name}" executed. Total impact: ${totalImpact}`,
      userId: user.id,
      userName: user.name || 'Unknown',
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(updated);
}