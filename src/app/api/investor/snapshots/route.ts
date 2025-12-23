// src/app/api/investor/snapshots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const periodType = searchParams.get('periodType');
  const limit = parseInt(searchParams.get('limit') || '12');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (periodType) where.periodType = periodType;

  const snapshots = await prisma.investorSnapshot.findMany({
    where,
    orderBy: { snapshotDate: 'desc' },
    take: limit,
  });

  return NextResponse.json({ snapshots });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.snapshotDate) return badRequest('snapshotDate is required');

  // Calculate metrics from actual data (simplified - would aggregate from transactions, etc.)
  const snapshot = await prisma.investorSnapshot.create({
    data: {
      snapshotDate: new Date(body.snapshotDate),
      periodType: body.periodType || 'monthly',
      periodLabel: body.periodLabel || formatPeriodLabel(new Date(body.snapshotDate), body.periodType || 'monthly'),
      revenueMTD: body.revenueMTD || 0,
      revenueQTD: body.revenueQTD || 0,
      revenueYTD: body.revenueYTD || 0,
      revenueTTM: body.revenueTTM || 0,
      totalCosts: body.totalCosts || 0,
      fixedCosts: body.fixedCosts || 0,
      variableCosts: body.variableCosts || 0,
      grossMargin: body.grossMargin || 0,
      grossMarginPercent: body.grossMarginPercent || 0,
      operatingMargin: body.operatingMargin || 0,
      operatingMarginPercent: body.operatingMarginPercent || 0,
      ebitda: body.ebitda || 0,
      ebitdaMarginPercent: body.ebitdaMarginPercent || 0,
      netMargin: body.netMargin || 0,
      netMarginPercent: body.netMarginPercent || 0,
      cashAndEquivalents: body.cashAndEquivalents || 0,
      restrictedCash: body.restrictedCash || 0,
      totalCash: body.totalCash || 0,
      shortTermLiabilities: body.shortTermLiabilities || 0,
      longTermLiabilities: body.longTermLiabilities || 0,
      totalLiabilities: body.totalLiabilities || 0,
      currentAssets: body.currentAssets || 0,
      currentLiabilities: body.currentLiabilities || 0,
      netWorkingCapital: body.netWorkingCapital || 0,
      employeeCount: body.employeeCount || 0,
      revenuePerEmployee: body.revenuePerEmployee,
      costPerEmployee: body.costPerEmployee,
      unitEconomics: body.unitEconomics,
      currentRatio: body.currentRatio,
      quickRatio: body.quickRatio,
      monthlyBurn: body.monthlyBurn || 0,
      burnAvg3Month: body.burnAvg3Month || 0,
      burnAvg6Month: body.burnAvg6Month || 0,
      burnTrend: body.burnTrend || 'flat',
      burnTrendPercent: body.burnTrendPercent || 0,
      runwayMonths: body.runwayMonths,
      runwayEndDate: body.runwayEndDate ? new Date(body.runwayEndDate) : null,
      overallRiskLevel: body.overallRiskLevel || 'moderate',
      liquidityRisk: body.liquidityRisk || 'low',
      dataQuality: body.dataQuality || 'complete',
      dataCompleteness: body.dataCompleteness || 100,
      currency: body.currency || 'EUR',
      computedBy: user.name || user.id,
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(snapshot, { status: 201 });
}

function formatPeriodLabel(date: Date, periodType: string): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const quarter = Math.ceil(month / 3);

  switch (periodType) {
    case 'monthly':
      return `${year}-${String(month).padStart(2, '0')}`;
    case 'quarterly':
      return `Q${quarter} ${year}`;
    case 'yearly':
      return `${year}`;
    default:
      return date.toISOString().split('T')[0];
  }
}