// src/app/api/kpis/calculate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const orgId = user.organizationId;

  // Get all formula-based KPIs
  const kpis = await prisma.kPI.findMany({
    where: { organizationId: orgId, calculationType: 'formula' },
  });

  // TODO: Implement actual calculation logic based on formulas
  // This would involve parsing formulas and fetching source data
  // For now, we'll just update the lastCalculatedAt timestamp

  const results: { kpiId: string; success: boolean; error?: string }[] = [];

  for (const kpi of kpis) {
    try {
      await prisma.kPI.update({
        where: { id: kpi.id },
        data: {
          lastCalculatedAt: new Date(),
          dataFreshness: 'fresh',
        },
      });
      results.push({ kpiId: kpi.id, success: true });
    } catch (error) {
      results.push({ kpiId: kpi.id, success: false, error: (error as Error).message });
    }
  }

  // Check for threshold breaches and create alerts
  const allKpis = await prisma.kPI.findMany({
    where: { organizationId: orgId },
  });

  for (const kpi of allKpis) {
    if (kpi.thresholds && kpi.currentValue !== null) {
      const thresholds = kpi.thresholds as { hardMin?: number; hardMax?: number };
      const value = Number(kpi.currentValue);

      let alertType: string | null = null;
      let severity: string = 'warning';

      if (thresholds.hardMin !== undefined && value < thresholds.hardMin) {
        alertType = 'threshold_breach';
        severity = 'critical';
      } else if (thresholds.hardMax !== undefined && value > thresholds.hardMax) {
        alertType = 'threshold_breach';
        severity = 'critical';
      }

      if (alertType) {
        // Check if alert already exists
        const existingAlert = await prisma.kPIAlert.findFirst({
          where: {
            kpiId: kpi.id,
            type: alertType,
            isDismissed: false,
            triggeredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Within last 24 hours
          },
        });

        if (!existingAlert) {
          await prisma.kPIAlert.create({
            data: {
              kpiId: kpi.id,
              organizationId: orgId,
              type: alertType,
              severity,
              title: `${kpi.name} threshold breach`,
              message: `${kpi.name} (${value}) has breached the defined threshold`,
              currentValue: value,
              threshold: thresholds.hardMin ?? thresholds.hardMax,
            },
          });
        }
      }
    }
  }

  return NextResponse.json({ results, calculatedAt: new Date().toISOString() });
}