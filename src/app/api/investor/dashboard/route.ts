// src/app/api/investor/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const orgId = user.organizationId;

  // Fetch latest snapshot and related data
  const [snapshot, investors, runwayProjections, latestReport] = await Promise.all([
    prisma.investorSnapshot.findFirst({
      where: { organizationId: orgId },
      orderBy: { snapshotDate: 'desc' },
    }),
    prisma.investor.findMany({
      where: { organizationId: orgId, status: 'active' },
      include: { investments: true },
    }),
    prisma.runwayProjection.findMany({
      where: { organizationId: orgId, isActive: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.boardReport.findFirst({
      where: { organizationId: orgId, status: 'published' },
      orderBy: { publishedAt: 'desc' },
    }),
  ]);

  // Get organization info
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true, defaultCurrency: true, fiscalYearEnd: true },
  });

  // Log access
  await prisma.investorAccessLog.create({
    data: {
      userId: user.id,
      userName: user.name || 'Unknown',
      userRole: 'user',
      action: 'view_dashboard',
      section: 'overview',
      organizationId: orgId,
    },
  });

  // Build dashboard response
  const dashboard = buildDashboard(snapshot, investors, runwayProjections, latestReport, org);

  return NextResponse.json(dashboard);
}

function buildDashboard(
  snapshot: any,
  investors: any[],
  runwayProjections: any[],
  latestReport: any,
  org: any
) {
  const currency = org?.defaultCurrency || 'EUR';
  const now = new Date();

  // If no snapshot, return defaults
  if (!snapshot) {
    return getDefaultDashboard(currency, org);
  }

  // Build revenue metrics
  const revenue = {
    mtd: createMetric(Number(snapshot.revenueMTD), currency, 'mtd'),
    qtd: createMetric(Number(snapshot.revenueQTD), currency, 'qtd'),
    ytd: createMetric(Number(snapshot.revenueYTD), currency, 'ytd'),
    ttm: createMetric(Number(snapshot.revenueTTM), currency, 'ttm'),
  };

  // Build cost metrics
  const costs = {
    totalCosts: createMetric(Number(snapshot.totalCosts), currency, 'ytd'),
    fixedCosts: createMetric(Number(snapshot.fixedCosts), currency, 'ytd'),
    variableCosts: createMetric(Number(snapshot.variableCosts), currency, 'ytd'),
    fixedToVariableRatio: Number(snapshot.fixedCosts) / (Number(snapshot.variableCosts) || 1),
  };

  // Build margin metrics
  const margins = {
    grossMargin: createMetric(Number(snapshot.grossMargin), currency, 'ytd'),
    grossMarginPercent: Number(snapshot.grossMarginPercent),
    operatingMargin: createMetric(Number(snapshot.operatingMargin), currency, 'ytd'),
    operatingMarginPercent: Number(snapshot.operatingMarginPercent),
    ebitda: createMetric(Number(snapshot.ebitda), currency, 'ytd'),
    ebitdaMarginPercent: Number(snapshot.ebitdaMarginPercent),
    netMargin: createMetric(Number(snapshot.netMargin), currency, 'ytd'),
    netMarginPercent: Number(snapshot.netMarginPercent),
  };

  // Build burn metrics
  const burn = {
    currentMonthlyBurn: createMetric(Number(snapshot.monthlyBurn), currency, 'mtd'),
    rollingAverage3Month: createMetric(Number(snapshot.burnAvg3Month), currency, 'mtd'),
    rollingAverage6Month: createMetric(Number(snapshot.burnAvg6Month), currency, 'mtd'),
    rollingAverage12Month: createMetric(0, currency, 'ttm'),
    burnTrend: snapshot.burnTrend as 'up' | 'down' | 'flat',
    burnTrendPercent: Number(snapshot.burnTrendPercent),
    monthlyBurnHistory: [],
  };

  // Build runway from projections
  const baseProjection = runwayProjections.find((p) => p.scenarioType === 'base');
  const runway = {
    currentCash: Number(snapshot.totalCash),
    currency,
    scenarios: runwayProjections.map((p) => ({
      type: p.scenarioType,
      assumptions: p.assumptions as string[],
      monthlyBurnRate: Number(p.monthlyBurnRate),
      runwayMonths: Number(p.runwayMonths),
      runwayEndDate: p.runwayEndDate.toISOString(),
      confidenceLevel: Number(p.confidenceLevel),
    })),
    primaryScenario: 'base',
    dataInputs: baseProjection?.dataInputs || [],
    timeHorizon: '12_months',
    projectionBasis: baseProjection?.projectionBasis || 'historical',
    lastCalculated: snapshot.computedAt.toISOString(),
    warnings: baseProjection?.warnings || [],
  };

  // Build risk indicators
  const risks = {
    overallRiskLevel: snapshot.overallRiskLevel,
    liquidityRisk: snapshot.liquidityRisk,
    concentrationRisks: latestReport?.concentrationRisks || [],
    currencyExposure: [],
    interestRateExposure: undefined,
  };

  // Build compliance signals
  const compliance = {
    dataCompletenessPercent: Number(snapshot.dataCompleteness),
    dataQuality: snapshot.dataQuality,
    reconciliationCoverage: 85,
    auditTrailAvailable: true,
    knownDataGaps: [],
    pendingReconciliations: 0,
  };

  // Build board summary
  const boardSummary = latestReport
    ? {
        asOfDate: latestReport.asOfDate.toISOString(),
        periodCovered: latestReport.periodCovered,
        financialHealthStatus: latestReport.financialHealthStatus,
        keyHighlights: latestReport.keyHighlights,
        materialChanges: latestReport.materialChanges,
        liquidityStatus: latestReport.liquidityStatus || 'Adequate liquidity maintained',
        sustainabilityOutlook: latestReport.sustainabilityOutlook || 'Stable outlook',
        riskFactors: latestReport.riskFactors,
        dataLimitations: latestReport.dataLimitations,
        generatedAt: latestReport.updatedAt.toISOString(),
      }
    : getDefaultBoardSummary();

  return {
    organizationName: org?.name || 'Organization',
    reportingCurrency: currency,
    fiscalYearEnd: org?.fiscalYearEnd || '12-31',
    lastDataRefresh: snapshot.computedAt.toISOString(),
    revenue,
    costs,
    margins,
    cashPosition: {
      cashAndEquivalents: createMetric(Number(snapshot.cashAndEquivalents), currency, 'mtd'),
      restrictedCash: createMetric(Number(snapshot.restrictedCash), currency, 'mtd'),
      totalCash: createMetric(Number(snapshot.totalCash), currency, 'mtd'),
    },
    liabilities: {
      shortTermLiabilities: createMetric(Number(snapshot.shortTermLiabilities), currency, 'mtd'),
      longTermLiabilities: createMetric(Number(snapshot.longTermLiabilities), currency, 'mtd'),
      totalLiabilities: createMetric(Number(snapshot.totalLiabilities), currency, 'mtd'),
      currentRatio: snapshot.currentRatio ? Number(snapshot.currentRatio) : undefined,
      quickRatio: snapshot.quickRatio ? Number(snapshot.quickRatio) : undefined,
    },
    workingCapital: {
      currentAssets: createMetric(Number(snapshot.currentAssets), currency, 'mtd'),
      currentLiabilities: createMetric(Number(snapshot.currentLiabilities), currency, 'mtd'),
      netWorkingCapital: createMetric(Number(snapshot.netWorkingCapital), currency, 'mtd'),
      workingCapitalRatio: Number(snapshot.currentAssets) / (Number(snapshot.currentLiabilities) || 1),
    },
    efficiency: {
      revenuePerEmployee: createMetric(Number(snapshot.revenuePerEmployee) || 0, currency, 'ytd'),
      costPerEmployee: createMetric(Number(snapshot.costPerEmployee) || 0, currency, 'ytd'),
      employeeCount: snapshot.employeeCount,
      unitEconomics: snapshot.unitEconomics,
    },
    burn,
    runway,
    risks,
    compliance,
    boardSummary,
    dataQualityOverall: snapshot.dataQuality,
    disclaimers: [
      'This dashboard presents financial information for informational purposes only.',
      'Forward-looking statements involve risks and uncertainties.',
      'All financial data is unaudited unless otherwise specified.',
    ],
  };
}

function createMetric(value: number, currency: string, period: string) {
  return {
    value,
    currency,
    period,
    periodStart: new Date().toISOString(),
    periodEnd: new Date().toISOString(),
    dataQuality: 'complete',
    lastUpdated: new Date().toISOString(),
  };
}

function getDefaultDashboard(currency: string, org: any) {
  return {
    organizationName: org?.name || 'Organization',
    reportingCurrency: currency,
    fiscalYearEnd: org?.fiscalYearEnd || '12-31',
    lastDataRefresh: new Date().toISOString(),
    revenue: { mtd: createMetric(0, currency, 'mtd'), qtd: createMetric(0, currency, 'qtd'), ytd: createMetric(0, currency, 'ytd'), ttm: createMetric(0, currency, 'ttm') },
    costs: { totalCosts: createMetric(0, currency, 'ytd'), fixedCosts: createMetric(0, currency, 'ytd'), variableCosts: createMetric(0, currency, 'ytd'), fixedToVariableRatio: 0 },
    margins: { grossMargin: createMetric(0, currency, 'ytd'), grossMarginPercent: 0 },
    cashPosition: { totalCash: createMetric(0, currency, 'mtd') },
    liabilities: { totalLiabilities: createMetric(0, currency, 'mtd') },
    workingCapital: { netWorkingCapital: createMetric(0, currency, 'mtd'), workingCapitalRatio: 0 },
    efficiency: { employeeCount: 0 },
    burn: { currentMonthlyBurn: createMetric(0, currency, 'mtd'), burnTrend: 'flat', burnTrendPercent: 0 },
    runway: { currentCash: 0, currency, scenarios: [], primaryScenario: 'base', dataInputs: [], timeHorizon: '12_months', projectionBasis: 'historical', lastCalculated: new Date().toISOString() },
    risks: { overallRiskLevel: 'moderate', liquidityRisk: 'low', concentrationRisks: [] },
    compliance: { dataCompletenessPercent: 0, dataQuality: 'limited', reconciliationCoverage: 0, auditTrailAvailable: false, knownDataGaps: ['No data available'], pendingReconciliations: 0 },
    boardSummary: getDefaultBoardSummary(),
    dataQualityOverall: 'limited',
    disclaimers: [],
  };
}

function getDefaultBoardSummary() {
  return {
    asOfDate: new Date().toISOString(),
    periodCovered: 'Current Period',
    financialHealthStatus: 'stable',
    keyHighlights: [],
    materialChanges: [],
    liquidityStatus: 'Data pending',
    sustainabilityOutlook: 'Assessment pending',
    riskFactors: [],
    dataLimitations: ['Limited data available'],
    generatedAt: new Date().toISOString(),
  };
}