// src/app/api/liquidity/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const orgId = user.organizationId;

  // Get latest position
  const latestPosition = await prisma.liquidityPosition.findFirst({
    where: { organizationId: orgId },
    orderBy: { positionDate: 'desc' },
  });

  // Get active scenarios
  const scenarios = await prisma.liquidityScenario.findMany({
    where: { organizationId: orgId, isActive: true },
    orderBy: { type: 'asc' },
  });

  // Get active gaps
  const gaps = await prisma.liquidityGap.findMany({
    where: { organizationId: orgId, status: { in: ['projected', 'confirmed'] } },
    orderBy: { startDate: 'asc' },
  });

  // Get active risk signals
  const riskSignals = await prisma.liquidityRiskSignal.findMany({
    where: { organizationId: orgId, status: 'active' },
    orderBy: [{ riskLevel: 'desc' }, { detectedAt: 'desc' }],
  });

  // Get organization info
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true, defaultCurrency: true },
  });

  // Log access
  await prisma.liquidityAuditLog.create({
    data: {
      action: 'view',
      details: 'Dashboard viewed',
      userId: user.id,
      userName: user.name,
      organizationId: orgId,
    },
  });

  // Build risk summary
  const riskSummary = buildRiskSummary(latestPosition, riskSignals, gaps);

  // Find scenarios by type
  const baseScenario = scenarios.find((s) => s.type === 'base');
  const conservativeScenario = scenarios.find((s) => s.type === 'conservative');
  const stressScenario = scenarios.find((s) => s.type === 'stress');
  const customScenarios = scenarios.filter((s) => s.type === 'custom');

  const dashboard = {
    organizationName: org?.name || 'Organization',
    baseCurrency: org?.defaultCurrency || 'EUR',
    lastRefresh: new Date().toISOString(),
    dataAsOf: latestPosition?.positionDate?.toISOString() || new Date().toISOString(),

    // Current position
    currentCashBalance: latestPosition ? Number(latestPosition.totalCash) : 0,
    minimumBuffer: latestPosition ? Number(latestPosition.minimumBuffer) : 0,
    availableLiquidity: latestPosition ? Number(latestPosition.totalLiquidity) : 0,

    // Scenarios
    baseScenario: baseScenario ? mapScenario(baseScenario) : null,
    conservativeScenario: conservativeScenario ? mapScenario(conservativeScenario) : null,
    stressScenario: stressScenario ? mapScenario(stressScenario) : null,
    customScenarios: customScenarios.map(mapScenario),

    // Risk
    riskSummary,

    // Gaps
    liquidityGaps: gaps.map((g) => ({
      id: g.id,
      startDate: g.startDate.toISOString(),
      endDate: g.endDate.toISOString(),
      durationDays: g.durationDays,
      peakDeficit: Number(g.peakDeficit),
      averageDeficit: Number(g.averageDeficit),
      totalDeficitDays: Number(g.totalDeficitDays),
      causes: g.causes,
      affectedPeriods: g.affectedPeriods,
      severity: g.severity,
    })),

    // Confidence bands would be computed from scenarios
    confidenceBands: [],

    // Data quality
    dataCompleteness: latestPosition ? Number(latestPosition.dataCompleteness) : 0,
    knownBlindSpots: (latestPosition?.knownBlindSpots as string[]) || [],

    // Disclaimers
    disclaimers: [
      'Liquidity projections are estimates based on current data and assumptions.',
      'Actual cash flows may differ from projections.',
      'Scenarios are for planning purposes only.',
    ],
  };

  return NextResponse.json(dashboard);
}

function buildRiskSummary(position: any, signals: any[], gaps: any[]) {
  const activeSignals = signals.filter((s) => s.status === 'active');
  const upcomingGaps = gaps.filter((g) => new Date(g.startDate) > new Date());

  // Determine overall risk level
  let overallRisk = 'low';
  if (activeSignals.some((s) => s.riskLevel === 'critical')) overallRisk = 'critical';
  else if (activeSignals.some((s) => s.riskLevel === 'high')) overallRisk = 'high';
  else if (activeSignals.some((s) => s.riskLevel === 'elevated')) overallRisk = 'elevated';
  else if (activeSignals.some((s) => s.riskLevel === 'moderate')) overallRisk = 'moderate';

  // Calculate risk score
  const riskScoreMap: Record<string, number> = { low: 10, moderate: 30, elevated: 50, high: 70, critical: 90 };
  const avgScore = activeSignals.length > 0
    ? activeSignals.reduce((sum, s) => sum + (riskScoreMap[s.riskLevel] || 0), 0) / activeSignals.length
    : 10;

  return {
    overallRisk,
    riskScore: Math.round(avgScore),
    signals: activeSignals.map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      description: s.description,
      riskLevel: s.riskLevel,
      metric: Number(s.metric),
      threshold: Number(s.threshold),
      breached: s.breached,
      affectedPeriod: s.affectedPeriod,
      detectedAt: s.detectedAt.toISOString(),
    })),
    currentBuffer: position ? Number(position.totalCash) - Number(position.minimumBuffer || 0) : 0,
    bufferDays: position?.bufferDays || 0,
    concentrationIndex: position ? Number(position.concentrationIndex || 0) : 0,
    volatilityIndex: position ? Number(position.volatilityIndex || 0) : 0,
    totalGaps: gaps.length,
    upcomingGaps: upcomingGaps.length,
    lastAssessed: new Date().toISOString(),
  };
}

function mapScenario(s: any) {
  return {
    id: s.id,
    type: s.type,
    name: s.name,
    description: s.description,
    assumptions: s.assumptions,
    timeline: s.timeline,
    varianceVsBase: s.varianceEndingBalance
      ? {
          endingBalanceDiff: Number(s.varianceEndingBalance),
          lowestBalanceDiff: Number(s.varianceLowestBalance),
          additionalGapDays: s.additionalGapDays || 0,
        }
      : undefined,
    isHypothetical: true,
    createdAt: s.createdAt.toISOString(),
    createdBy: s.createdBy,
  };
}