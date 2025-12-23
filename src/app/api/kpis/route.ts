// src/app/api/kpis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const pinned = searchParams.get('pinned');

  const where: Record<string, unknown> = { 
    organizationId: user.organizationId,
    isVisible: true,
  };
  if (category) where.category = category;
  if (status) where.status = status;
  if (pinned === 'true') where.isPinned = true;

  const kpis = await prisma.kPI.findMany({
    where,
    include: {
      history: {
        orderBy: { periodStart: 'desc' },
        take: 12,
      },
      alerts: {
        where: { isDismissed: false },
        orderBy: { triggeredAt: 'desc' },
        take: 5,
      },
      targets: {
        where: { status: 'active' },
        orderBy: { periodStart: 'desc' },
        take: 1,
      },
      benchmarks: {
        where: { isActive: true },
        take: 3,
      },
    },
    orderBy: [{ isPinned: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
  });

  return NextResponse.json({
    kpis: kpis.map(mapKPI),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.code || !body.name || !body.category) {
    return badRequest('code, name, and category are required');
  }

  const kpi = await prisma.kPI.create({
    data: {
      code: body.code,
      name: body.name,
      shortName: body.shortName,
      description: body.description,
      category: body.category,
      calculationType: body.calculationType || 'manual',
      formula: body.formula,
      dataSource: body.dataSource,
      dataSources: body.dataSources || [],
      unit: body.unit || 'number',
      format: body.format || '0.0',
      higherIsBetter: body.higherIsBetter ?? true,
      currentValue: body.currentValue,
      previousValue: body.previousValue,
      targetValue: body.targetValue,
      baselineValue: body.baselineValue,
      thresholds: body.thresholds,
      displayOrder: body.displayOrder || 0,
      isVisible: body.isVisible ?? true,
      isPinned: body.isPinned ?? false,
      tags: body.tags || [],
      notes: body.notes,
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(kpi, { status: 201 });
}

function mapKPI(k: any) {
  const current = k.currentValue ? Number(k.currentValue) : 0;
  const previous = k.previousValue ? Number(k.previousValue) : 0;
  const target = k.targetValue ? Number(k.targetValue) : undefined;

  // Calculate deltas
  const deltaVsPrior = current - previous;
  const deltaVsPriorPercent = previous !== 0 ? (deltaVsPrior / previous) * 100 : 0;
  const deltaVsTarget = target !== undefined ? current - target : undefined;
  const deltaVsTargetPercent = target !== undefined && target !== 0 ? ((current - target) / target) * 100 : undefined;

  return {
    id: k.id,
    definition: {
      id: k.id,
      name: k.name,
      shortName: k.shortName,
      description: k.description,
      category: k.category,
      unit: k.unit,
      format: k.format,
      higherIsBetter: k.higherIsBetter,
      calculationLogic: k.formula || k.calculationType,
      dataSources: k.dataSources || [],
      thresholds: k.thresholds || {},
    },
    value: {
      current,
      previous,
      target,
      deltaVsPrior,
      deltaVsPriorPercent,
      deltaVsTarget,
      deltaVsTargetPercent,
      status: k.status,
      trend: k.trend,
      momentum: k.trendMomentum,
    },
    history: k.history.map((h: any) => ({
      period: h.periodLabel,
      periodLabel: h.periodLabel,
      value: Number(h.value),
      target: h.targetValue ? Number(h.targetValue) : undefined,
      isAnomaly: h.isAnomaly,
      annotation: h.annotation,
    })),
    rollingAverage: k.rollingAvg3M ? Number(k.rollingAvg3M) : current,
    seasonalityFactor: k.seasonalityFactor ? Number(k.seasonalityFactor) : undefined,
    lastUpdatedAt: k.updatedAt.toISOString(),
    dataFreshness: k.dataFreshness,
    alerts: k.alerts.map((a: any) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      title: a.title,
      message: a.message,
      currentValue: Number(a.currentValue),
      threshold: a.threshold ? Number(a.threshold) : undefined,
      triggeredAt: a.triggeredAt.toISOString(),
      isRead: a.isRead,
      isDismissed: a.isDismissed,
      suggestedAction: a.suggestedAction,
    })),
    benchmarks: k.benchmarks.map((b: any) => ({
      source: b.source,
      sourceName: b.sourceName,
      value: Number(b.value),
      percentile: b.percentile ? Number(b.percentile) : undefined,
    })),
    isPinned: k.isPinned,
    displayOrder: k.displayOrder,
    tags: k.tags,
  };
}