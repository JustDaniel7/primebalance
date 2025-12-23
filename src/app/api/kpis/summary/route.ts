// src/app/api/kpis/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const orgId = user.organizationId;

  // Get all visible KPIs
  const kpis = await prisma.kPI.findMany({
    where: { organizationId: orgId, isVisible: true },
    include: {
      alerts: { where: { isDismissed: false } },
    },
  });

  // Get active alerts
  const alerts = await prisma.kPIAlert.findMany({
    where: { organizationId: orgId, isDismissed: false },
    orderBy: { triggeredAt: 'desc' },
    take: 10,
  });

  // Calculate summary
  const onTrackCount = kpis.filter((k) => k.status === 'on_track').length;
  const watchCount = kpis.filter((k) => k.status === 'watch').length;
  const offTrackCount = kpis.filter((k) => k.status === 'off_track').length;

  const improvingCount = kpis.filter((k) => k.trend === 'improving').length;
  const stableCount = kpis.filter((k) => k.trend === 'stable').length;
  const deterioratingCount = kpis.filter((k) => k.trend === 'deteriorating').length;

  // Find key metrics by code
  const findKPI = (code: string) => kpis.find((k) => k.code === code);
  const grossMarginKPI = findKPI('GROSS_MARGIN');
  const operatingMarginKPI = findKPI('EBITDA_MARGIN') || findKPI('OPERATING_MARGIN');
  const burnKPI = findKPI('CASH_BURN') || findKPI('NET_BURN');
  const runwayKPI = findKPI('RUNWAY_MONTHS');
  const cccKPI = findKPI('CCC') || findKPI('DSO');
  const ltvCacKPI = findKPI('LTV_CAC');

  const summary = {
    onTrackCount,
    watchCount,
    offTrackCount,
    totalCount: kpis.length,

    // Key Metrics
    grossMargin: grossMarginKPI?.currentValue ? Number(grossMarginKPI.currentValue) : 0,
    operatingMargin: operatingMarginKPI?.currentValue ? Number(operatingMarginKPI.currentValue) : 0,
    netBurnRate: burnKPI?.currentValue ? Number(burnKPI.currentValue) : 0,
    runwayMonths: runwayKPI?.currentValue ? Number(runwayKPI.currentValue) : 0,
    cashConversionCycle: cccKPI?.currentValue ? Number(cccKPI.currentValue) : 0,
    ltvCacRatio: ltvCacKPI?.currentValue ? Number(ltvCacKPI.currentValue) : 0,

    // Trends
    improvingCount,
    stableCount,
    deterioratingCount,

    // Alerts
    activeAlerts: alerts.length,
    criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,

    // Data Quality
    lastUpdatedAt: new Date().toISOString(),
    dataFreshness: kpis.every((k) => k.dataFreshness === 'fresh') ? 'fresh' : 'stale',
  };

  return NextResponse.json({
    summary,
    alerts: alerts.map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      kpiId: a.kpiId,
      title: a.title,
      message: a.message,
      currentValue: Number(a.currentValue),
      threshold: a.threshold ? Number(a.threshold) : undefined,
      triggeredAt: a.triggeredAt.toISOString(),
      isRead: a.isRead,
      suggestedAction: a.suggestedAction,
    })),
  });
}