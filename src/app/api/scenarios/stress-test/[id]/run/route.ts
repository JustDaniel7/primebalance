// src/app/api/scenarios/stress-tests/[id]/run/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const stressTest = await prisma.stressTest.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!stressTest) return notFound('Stress Test');

  // Calculate result based on intensity
  const intensity = body.intensity || stressTest.intensity;
  const intensityMap: Record<string, number> = { mild: 5, moderate: 15, severe: 25, extreme: 40 };
  const intensityValue = intensityMap[intensity] || 15;

  // Simulate stress test results (in real implementation, this would use actual data)
  const baseMetrics = { revenue: 1000000, costs: 700000, cash: 500000, netPosition: 300000 };
  const impactFactor = 1 - (intensityValue / 100);

  const resultMetrics = {
    revenue: baseMetrics.revenue * impactFactor,
    costs: baseMetrics.costs * (2 - impactFactor), // Costs might increase
    cash: baseMetrics.cash * impactFactor,
    netPosition: baseMetrics.revenue * impactFactor - baseMetrics.costs * (2 - impactFactor),
    profitMargin: ((baseMetrics.revenue * impactFactor - baseMetrics.costs * (2 - impactFactor)) / (baseMetrics.revenue * impactFactor)) * 100,
    cashRunwayDays: Math.round(90 * impactFactor),
    revenueDelta: baseMetrics.revenue * (impactFactor - 1),
    costsDelta: baseMetrics.costs * (1 - impactFactor),
    cashDelta: baseMetrics.cash * (impactFactor - 1),
    netDelta: 0,
    revenueChangePercent: (impactFactor - 1) * 100,
    costsChangePercent: (1 - impactFactor) * 100,
    cashChangePercent: (impactFactor - 1) * 100,
    netChangePercent: 0,
  };

  // Determine result
  let result: 'pass' | 'warning' | 'fail' = 'pass';
  if (resultMetrics.cash < 100000) result = 'fail';
  else if (resultMetrics.cash < 200000) result = 'warning';

  const updated = await prisma.stressTest.update({
    where: { id },
    data: {
      intensity,
      result,
      resultMetrics,
      lastRunAt: new Date(),
      cashShortfallPoint: result === 'fail' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
    },
  });

  return NextResponse.json(updated);
}