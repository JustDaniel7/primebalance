// src/app/api/forecasts/revenue/[id]/line-items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: forecastId } = await params;
  const body = await req.json();

  if (!body.name) return badRequest('Name is required');

  // Verify forecast belongs to organization
  const forecast = await prisma.revenueForecast.findFirst({
    where: { id: forecastId, organizationId: user.organizationId },
  });
  if (!forecast) return notFound('Revenue Forecast');

  const lineItem = await prisma.revenueLineItem.create({
    data: {
      name: body.name,
      category: body.category || 'product',
      revenueType: body.revenueType || 'recurring',
      segment: body.segment,
      region: body.region,
      customerId: body.customerId,
      customerName: body.customerName,
      periods: body.periods || {},
      isCommitted: body.isCommitted || false,
      isAtRisk: body.isAtRisk || false,
      isRenewal: body.isRenewal || false,
      hasUpsell: body.hasUpsell || false,
      hasDownsell: body.hasDownsell || false,
      highUncertainty: body.highUncertainty || false,
      drivers: body.drivers || [],
      confidence: body.confidence || 'medium',
      confidenceScore: body.confidenceScore || 50,
      revenueForecastId: forecastId,
    },
  });

  // Recalculate forecast totals
  await recalculateRevenueTotals(forecastId);

  return NextResponse.json(lineItem, { status: 201 });
}

async function recalculateRevenueTotals(forecastId: string) {
  const lineItems = await prisma.revenueLineItem.findMany({
    where: { revenueForecastId: forecastId },
  });

  let totalExpected = 0;
  let totalBestCase = 0;
  let totalWorstCase = 0;
  let committedRevenue = 0;
  let atRiskRevenue = 0;

  lineItems.forEach((item) => {
    const periods = item.periods as Record<string, { expected?: number; bestCase?: number; worstCase?: number }>;
    Object.values(periods).forEach((p) => {
      totalExpected += p.expected || 0;
      totalBestCase += p.bestCase || 0;
      totalWorstCase += p.worstCase || 0;
    });
    if (item.isCommitted) {
      Object.values(periods).forEach((p) => {
        committedRevenue += p.expected || 0;
      });
    }
    if (item.isAtRisk) {
      Object.values(periods).forEach((p) => {
        atRiskRevenue += p.expected || 0;
      });
    }
  });

  await prisma.revenueForecast.update({
    where: { id: forecastId },
    data: {
      totalExpected,
      totalBestCase,
      totalWorstCase,
      committedRevenue,
      projectedRevenue: totalExpected - committedRevenue,
      atRiskRevenue,
    },
  });
}