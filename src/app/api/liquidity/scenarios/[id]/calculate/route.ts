// src/app/api/liquidity/scenarios/[id]/calculate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const scenario = await prisma.liquidityScenario.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!scenario) return notFound('Liquidity Scenario');

  // Get cashflow items within horizon
  const endDate = new Date(scenario.startDate);
  endDate.setDate(endDate.getDate() + scenario.horizonDays);

  const cashflows = await prisma.cashflowItem.findMany({
    where: {
      organizationId: user.organizationId,
      expectedDate: { gte: scenario.startDate, lte: endDate },
      status: 'pending',
    },
    orderBy: { expectedDate: 'asc' },
  });

  // Apply scenario assumptions
  const assumptions = scenario.assumptions as any;
  const adjustedCashflows = cashflows.map((cf) => {
    let adjustedAmount = Number(cf.amount);
    let adjustedDate = new Date(cf.expectedDate);

    if (cf.type === 'inflow') {
      // Apply inflow delays and reductions
      adjustedDate.setDate(adjustedDate.getDate() + (assumptions.inflowDelayDays || 0));
      adjustedAmount *= (1 - (assumptions.inflowReductionPercent || 0) / 100);

      // Exclude estimated if required
      if (assumptions.excludeEstimated && cf.confidence === 'estimated') {
        adjustedAmount = 0;
      }
      // Confirmed only
      if (assumptions.confirmedOnly && cf.confidence !== 'confirmed') {
        adjustedAmount = 0;
      }
    } else {
      // Apply outflow acceleration and increases
      adjustedDate.setDate(adjustedDate.getDate() - (assumptions.outflowAccelerationDays || 0));
      adjustedAmount *= (1 + (assumptions.outflowIncreasePercent || 0) / 100);
    }

    return { ...cf, adjustedAmount, adjustedDate };
  });

  // Build timeline
  const timeline = buildTimeline(
    scenario.timeBucket,
    scenario.startDate,
    endDate,
    Number(scenario.startingCashBalance),
    Number(scenario.minimumBuffer),
    adjustedCashflows
  );

  // Calculate summary metrics
  const totalInflows = adjustedCashflows.filter((cf) => cf.type === 'inflow').reduce((sum, cf) => sum + cf.adjustedAmount, 0);
  const totalOutflows = adjustedCashflows.filter((cf) => cf.type === 'outflow').reduce((sum, cf) => sum + cf.adjustedAmount, 0);
  const netChange = totalInflows - totalOutflows;
  const endingBalance = Number(scenario.startingCashBalance) + netChange;

  // Find lowest balance and gap days
  let lowestBalance = Number(scenario.startingCashBalance);
  let lowestBalanceDate = scenario.startDate;
  let daysWithGap = 0;
  let totalGapAmount = 0;

  timeline.periods.forEach((p: any) => {
    if (p.closingBalance < lowestBalance) {
      lowestBalance = p.closingBalance;
      lowestBalanceDate = new Date(p.periodEnd);
    }
    if (p.hasLiquidityGap) {
      daysWithGap += 7; // Approximate days per period
      totalGapAmount += Math.abs(p.gapAmount || 0);
    }
  });

  // Confidence breakdown
  const confirmed = cashflows.filter((cf) => cf.confidence === 'confirmed');
  const expected = cashflows.filter((cf) => cf.confidence === 'expected');
  const estimated = cashflows.filter((cf) => cf.confidence === 'estimated');

  const confirmedCashflows = confirmed.reduce((sum, cf) => sum + Number(cf.amount), 0);
  const expectedCashflows = expected.reduce((sum, cf) => sum + Number(cf.amount), 0);
  const estimatedCashflows = estimated.reduce((sum, cf) => sum + Number(cf.amount), 0);
  const total = confirmedCashflows + expectedCashflows + estimatedCashflows;
  const dataCompleteness = total > 0 ? (confirmedCashflows / total) * 100 : 0;

  // Update scenario with results
  const updated = await prisma.liquidityScenario.update({
    where: { id },
    data: {
      timeline,
      totalInflows,
      totalOutflows,
      netChange,
      endingBalance,
      lowestBalance,
      lowestBalanceDate,
      daysWithGap,
      totalGapAmount,
      confirmedCashflows,
      expectedCashflows,
      estimatedCashflows,
      dataCompleteness,
    },
  });

  return NextResponse.json(updated);
}

function buildTimeline(
  timeBucket: string,
  startDate: Date,
  endDate: Date,
  startingBalance: number,
  minimumBuffer: number,
  cashflows: any[]
) {
  const periods: any[] = [];
  let currentDate = new Date(startDate);
  let runningBalance = startingBalance;
  let periodIndex = 0;

  while (currentDate < endDate) {
    const periodEnd = new Date(currentDate);
    
    switch (timeBucket) {
      case 'daily':
        periodEnd.setDate(periodEnd.getDate() + 1);
        break;
      case 'weekly':
        periodEnd.setDate(periodEnd.getDate() + 7);
        break;
      case 'monthly':
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        break;
    }

    // Get cashflows for this period
    const periodCashflows = cashflows.filter((cf) => {
      const cfDate = new Date(cf.adjustedDate);
      return cfDate >= currentDate && cfDate < periodEnd;
    });

    const totalInflows = periodCashflows.filter((cf) => cf.type === 'inflow').reduce((sum, cf) => sum + cf.adjustedAmount, 0);
    const totalOutflows = periodCashflows.filter((cf) => cf.type === 'outflow').reduce((sum, cf) => sum + cf.adjustedAmount, 0);
    const netMovement = totalInflows - totalOutflows;
    const closingBalance = runningBalance + netMovement;
    const hasLiquidityGap = closingBalance < 0;
    const belowMinBuffer = closingBalance < minimumBuffer;

    periods.push({
      id: `period-${periodIndex}`,
      periodStart: currentDate.toISOString(),
      periodEnd: periodEnd.toISOString(),
      label: formatPeriodLabel(currentDate, timeBucket),
      openingBalance: runningBalance,
      closingBalance,
      totalInflows,
      totalOutflows,
      netMovement,
      isHistorical: currentDate < new Date(),
      hasLiquidityGap,
      gapAmount: hasLiquidityGap ? Math.abs(closingBalance) : 0,
      belowMinBuffer,
    });

    runningBalance = closingBalance;
    currentDate = periodEnd;
    periodIndex++;
  }

  return {
    id: `timeline-${Date.now()}`,
    periods,
    totalInflows: periods.reduce((sum, p) => sum + p.totalInflows, 0),
    totalOutflows: periods.reduce((sum, p) => sum + p.totalOutflows, 0),
  };
}

function formatPeriodLabel(date: Date, bucket: string): string {
  switch (bucket) {
    case 'daily':
      return date.toISOString().split('T')[0];
    case 'weekly':
      return `Week of ${date.toISOString().split('T')[0]}`;
    case 'monthly':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    default:
      return date.toISOString().split('T')[0];
  }
}