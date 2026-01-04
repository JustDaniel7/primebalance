// src/app/api/fx/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const orgId = user.organizationId;

  // Fetch all FX data in parallel
  const [rates, exposures, conversions, scenarios, costs, indicators] = await Promise.all([
    prisma.fXRate.findMany({
      where: { organizationId: orgId },
      orderBy: { timestamp: 'desc' },
      take: 20,
    }),
    prisma.fXExposure.findMany({
      where: { organizationId: orgId, status: { not: 'closed' } },
      orderBy: { grossExposure: 'desc' },
    }),
    prisma.fXConversion.findMany({
      where: { organizationId: orgId },
      orderBy: { conversionDate: 'desc' },
      take: 20,
    }),
    prisma.fXScenario.findMany({
      where: { organizationId: orgId, isActive: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.fXCost.findFirst({
      where: { organizationId: orgId },
      orderBy: { period: 'desc' },
    }),
    prisma.fXRiskIndicator.findMany({
      where: { organizationId: orgId, isActive: true },
      orderBy: { riskLevel: 'desc' },
    }),
  ]);

  // Compute exposure summary
  const totalGross = exposures.reduce((sum, e) => sum + Number(e.grossExposure), 0);
  const totalNet = exposures.reduce((sum, e) => sum + Number(e.netExposure), 0);
  const totalHedged = exposures.reduce((sum, e) => sum + Number(e.hedgedAmount), 0);
  const totalUnhedged = exposures.reduce((sum, e) => sum + Number(e.unhedgedAmount), 0);

  const exposureSummary = {
    baseCurrency: 'EUR',
    totalGrossExposure: totalGross,
    totalNetExposure: totalNet,
    totalHedged,
    totalUnhedged,
    hedgeRatio: totalGross > 0 ? (totalHedged / totalGross) * 100 : 0,
    exposureByCurrency: Object.entries(
      exposures.reduce((acc, e) => {
        const curr = e.quoteCurrency;
        acc[curr] = (acc[curr] || 0) + Number(e.netExposure);
        return acc;
      }, {} as Record<string, number>)
    ).map(([currency, amount]) => ({
      currency,
      amount,
      percentOfTotal: totalNet > 0 ? (amount / totalNet) * 100 : 0,
    })),
    lastCalculated: new Date().toISOString(),
  };

  // Compute conversion summary
  const conversionsByChannel = conversions.reduce((acc, c) => {
    const channel = c.executionChannel || 'unknown';
    if (!acc[channel]) {
      acc[channel] = { count: 0, volume: 0, totalCosts: 0 };
    }
    acc[channel].count += 1;
    acc[channel].volume += Number(c.sourceAmount);
    acc[channel].totalCosts += Number(c.totalCost);
    return acc;
  }, {} as Record<string, { count: number; volume: number; totalCosts: number }>);

  const conversionsByCurrencyPair = conversions.reduce((acc, c) => {
    const pair = `${c.sourceCurrency}/${c.targetCurrency}`;
    if (!acc[pair]) {
      acc[pair] = { count: 0, volume: 0, totalCosts: 0, avgRate: 0 };
    }
    acc[pair].count += 1;
    acc[pair].volume += Number(c.sourceAmount);
    acc[pair].totalCosts += Number(c.totalCost);
    acc[pair].avgRate = (acc[pair].avgRate * (acc[pair].count - 1) + Number(c.appliedRate)) / acc[pair].count;
    return acc;
  }, {} as Record<string, { count: number; volume: number; totalCosts: number; avgRate: number }>);

  const totalConversionVolume = conversions.reduce((sum, c) => sum + Number(c.sourceAmount), 0);
  const totalConversionCosts = conversions.reduce((sum, c) => sum + Number(c.totalCost), 0);
  const avgSpread = conversions.length > 0
    ? conversions.reduce((sum, c) => sum + Number(c.spreadCost), 0) / conversions.length
    : 0;

  const conversionSummary = {
    totalVolume: totalConversionVolume,
    totalCosts: totalConversionCosts,
    averageSpread: avgSpread,
    conversionCount: conversions.length,
    averageCostPercent: totalConversionVolume > 0 ? (totalConversionCosts / totalConversionVolume) * 100 : 0,
    byChannel: Object.entries(conversionsByChannel).map(([channel, data]) => ({
      channel,
      ...data,
      percentOfVolume: totalConversionVolume > 0 ? (data.volume / totalConversionVolume) * 100 : 0,
    })),
    byCurrencyPair: Object.entries(conversionsByCurrencyPair).map(([pair, data]) => ({
      pair,
      ...data,
      percentOfVolume: totalConversionVolume > 0 ? (data.volume / totalConversionVolume) * 100 : 0,
    })),
    periodStart: conversions.length > 0 ? conversions[conversions.length - 1].conversionDate.toISOString() : null,
    periodEnd: conversions.length > 0 ? conversions[0].conversionDate.toISOString() : null,
  };

  // Compute impact analysis
  const budgetRate = 1.10; // Example budget rate EUR/USD
  const actualAvgRate = conversions.length > 0
    ? conversions.reduce((sum, c) => sum + Number(c.appliedRate), 0) / conversions.length
    : budgetRate;

  const rateVariance = actualAvgRate - budgetRate;
  const volumeForImpact = totalConversionVolume;
  const rateImpact = rateVariance * volumeForImpact;

  const impactAnalysis = {
    budgetRate,
    actualAverageRate: actualAvgRate,
    rateVariance,
    rateVariancePercent: budgetRate > 0 ? (rateVariance / budgetRate) * 100 : 0,
    volumeAnalyzed: volumeForImpact,
    totalRateImpact: rateImpact,
    spreadImpact: totalConversionCosts,
    timingImpact: costs ? Number(costs.timingImpact) : 0,
    totalImpact: rateImpact + totalConversionCosts + (costs ? Number(costs.timingImpact) : 0),
    impactOnRevenue: costs ? Number(costs.revenueImpact) : rateImpact * 0.6,
    impactOnCosts: costs ? Number(costs.costImpact) : rateImpact * 0.4,
    impactOnCash: costs ? Number(costs.cashImpact) : rateImpact,
    netPnLImpact: costs ? Number(costs.netPnLImpact) : rateImpact,
    favorability: rateImpact >= 0 ? 'favorable' : 'unfavorable',
    analysisDate: new Date().toISOString(),
    methodology: 'Comparison of actual rates vs budget rates, plus explicit costs',
  };

  // Compute risk summary
  const criticalIndicators = indicators.filter((i) => i.riskLevel === 'critical' || i.riskLevel === 'high');
  const largestExposure = exposures.length > 0 ? exposures[0] : null;

  const riskSummary = {
    overallRiskLevel: criticalIndicators.length > 2 ? 'high' : criticalIndicators.length > 0 ? 'moderate' : 'low',
    riskScore: Math.max(0, 100 - criticalIndicators.length * 15),
    indicators: indicators.map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      description: i.description,
      riskLevel: i.riskLevel,
      metric: Number(i.metric),
      threshold: Number(i.threshold),
      breached: i.breached,
      currency: i.currency,
      recommendation: i.recommendation,
      lastAssessed: i.lastAssessed.toISOString(),
    })),
    largestExposure: largestExposure
      ? {
          currency: largestExposure.quoteCurrency,
          amount: Number(largestExposure.netExposure),
          percentOfTotal: totalNet > 0 ? (Number(largestExposure.netExposure) / totalNet) * 100 : 0,
        }
      : null,
    unhedgedExposurePercent: totalGross > 0 ? (totalUnhedged / totalGross) * 100 : 0,
    activeAlerts: indicators.filter((i) => i.breached).length,
    criticalAlerts: indicators.filter((i) => i.breached && i.riskLevel === 'critical').length,
    lastAssessed: new Date().toISOString(),
  };

  // Log dashboard access
  await prisma.fXAuditLog.create({
    data: {
      action: 'dashboard_view',
      category: 'access',
      details: 'FX Dashboard accessed',
      userId: user.id,
      userName: user.name || 'Unknown',
      organizationId: orgId,
    },
  });

  return NextResponse.json({
    baseCurrency: 'EUR',
    organizationName: 'Organization',
    lastDataRefresh: new Date().toISOString(),
    currentRates: rates.map((r) => ({
      id: r.id,
      baseCurrency: r.baseCurrency,
      quoteCurrency: r.quoteCurrency,
      rate: Number(r.rate),
      inverseRate: Number(r.inverseRate),
      source: r.source,
      timestamp: r.timestamp.toISOString(),
      validUntil: r.validUntil?.toISOString(),
      spread: r.spread ? Number(r.spread) : undefined,
    })),
    exposureSummary,
    exposures: exposures.map(mapExposure),
    recentConversions: conversions.map(mapConversion),
    riskSummary,
    conversionSummary,
    impactAnalysis,
    activeScenarios: scenarios.map(mapScenario),
    currentPeriodCosts: costs ? mapCost(costs) : null,
    dataQuality: 'complete',
    disclaimers: [
      'Exchange rates are indicative only and may differ from actual trading rates.',
      'This module provides decision-support information only.',
    ],
  });
}

function mapExposure(e: any) {
  return {
    id: e.id,
    currency: e.quoteCurrency,
    baseCurrency: e.baseCurrency,
    grossExposure: Number(e.grossExposure),
    netExposure: Number(e.netExposure),
    hedgedAmount: Number(e.hedgedAmount),
    unhedgedAmount: Number(e.unhedgedAmount),
    receivables: Number(e.receivables),
    payables: Number(e.payables),
    cashBalance: Number(e.cashBalance),
    operationalInflows: Number(e.operationalInflows),
    operationalOutflows: Number(e.operationalOutflows),
    structuralPositions: Number(e.structuralPositions),
    exposureType: e.type,
    direction: e.direction,
    timeHorizon: e.timeHorizon,
    entityId: e.entityId,
    entityName: e.entityName,
    spotRate: Number(e.spotRate),
    baseCurrencyValue: Number(e.baseCurrencyValue),
    valuationDate: e.valuationDate.toISOString(),
    riskLevel: e.riskLevel,
    volatility30d: e.volatility30d ? Number(e.volatility30d) : undefined,
    var95: e.var95 ? Number(e.var95) : undefined,
    lastUpdated: e.updatedAt.toISOString(),
    dataQuality: e.dataQuality,
  };
}

function mapConversion(c: any) {
  return {
    id: c.id,
    conversionNumber: c.conversionNumber,
    sourceCurrency: c.sourceCurrency,
    targetCurrency: c.targetCurrency,
    sourceAmount: Number(c.sourceAmount),
    targetAmount: Number(c.targetAmount),
    appliedRate: Number(c.appliedRate),
    referenceRate: c.referenceRate ? Number(c.referenceRate) : undefined,
    rateDeviation: c.rateDeviation ? Number(c.rateDeviation) : undefined,
    rateSource: c.rateSource,
    spreadCost: Number(c.spreadCost),
    feeCost: Number(c.feeCost),
    totalCost: Number(c.totalCost),
    effectiveRate: Number(c.effectiveRate),
    executionChannel: c.executionChannel,
    counterparty: c.counterparty,
    conversionDate: c.conversionDate.toISOString(),
    valueDate: c.valueDate.toISOString(),
    settlementDate: c.settlementDate?.toISOString(),
    status: c.status,
    purpose: c.purpose,
    relatedDocuments: c.relatedDocuments,
    initiatedBy: c.initiatedBy,
    approvedBy: c.approvedBy,
    createdAt: c.createdAt.toISOString(),
  };
}

function mapScenario(s: any) {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    baseCurrency: s.baseCurrency,
    rateAssumptions: s.rateAssumptions,
    totalExposureImpact: Number(s.totalExposureImpact),
    revenueImpact: Number(s.revenueImpact),
    costImpact: Number(s.costImpact),
    cashImpact: Number(s.cashImpact),
    scenarioType: s.scenarioType,
    severity: s.severity,
    probability: s.probability ? Number(s.probability) : undefined,
    createdAt: s.createdAt.toISOString(),
    isHypothetical: true,
  };
}

function mapCost(c: any) {
  return {
    id: c.id,
    period: c.period,
    baseCurrency: c.baseCurrency,
    spreadCosts: Number(c.spreadCosts),
    transactionFees: Number(c.transactionFees),
    bankCharges: Number(c.bankCharges),
    totalExplicitCosts: Number(c.totalExplicitCosts),
    rateDeviationImpact: Number(c.rateDeviationImpact),
    timingImpact: Number(c.timingImpact),
    totalImplicitCosts: Number(c.totalImplicitCosts),
    totalFXCosts: Number(c.totalFXCosts),
    costAsPercentOfVolume: Number(c.costAsPercentOfVolume),
    revenueImpact: Number(c.revenueImpact),
    costImpact: Number(c.costImpact),
    cashImpact: Number(c.cashImpact),
    netPnLImpact: Number(c.netPnLImpact),
    calculationMethod: c.calculationMethod,
    referenceRateUsed: c.referenceRateUsed,
    lastCalculated: c.lastCalculated.toISOString(),
  };
}