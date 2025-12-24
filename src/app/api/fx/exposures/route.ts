// src/app/api/fx/exposures/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const currency = searchParams.get('currency');
  const type = searchParams.get('type');
  const timeHorizon = searchParams.get('timeHorizon');
  const status = searchParams.get('status');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (currency) where.quoteCurrency = currency;
  if (type) where.type = type;
  if (timeHorizon) where.timeHorizon = timeHorizon;
  if (status) where.status = status;

  const exposures = await prisma.fXExposure.findMany({
    where,
    orderBy: { grossExposure: 'desc' },
  });

  return NextResponse.json({
    exposures: exposures.map((e) => ({
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
      status: e.status,
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
      hedgePercentage: Number(e.hedgePercentage),
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.baseCurrency || !body.quoteCurrency || !body.grossExposure) {
    return badRequest('baseCurrency, quoteCurrency, and grossExposure are required');
  }

  const netExposure = body.netExposure ?? body.grossExposure;
  const hedgedAmount = body.hedgedAmount ?? 0;
  const unhedgedAmount = netExposure - hedgedAmount;

  const exposure = await prisma.fXExposure.create({
    data: {
      baseCurrency: body.baseCurrency,
      quoteCurrency: body.quoteCurrency,
      type: body.type || 'transactional',
      direction: body.direction || 'inflow',
      timeHorizon: body.timeHorizon || 'short_term',
      status: 'open',
      grossExposure: body.grossExposure,
      netExposure,
      hedgedAmount,
      unhedgedAmount,
      hedgePercentage: body.grossExposure > 0 ? (hedgedAmount / body.grossExposure) * 100 : 0,
      receivables: body.receivables || 0,
      payables: body.payables || 0,
      cashBalance: body.cashBalance || 0,
      operationalInflows: body.operationalInflows || 0,
      operationalOutflows: body.operationalOutflows || 0,
      structuralPositions: body.structuralPositions || 0,
      entityId: body.entityId,
      entityName: body.entityName,
      spotRate: body.spotRate || 1,
      baseCurrencyValue: netExposure * (body.spotRate || 1),
      riskLevel: body.riskLevel || 'low',
      volatility30d: body.volatility30d,
      var95: body.var95,
      exposureDate: body.exposureDate ? new Date(body.exposureDate) : new Date(),
      settlementDate: body.settlementDate ? new Date(body.settlementDate) : null,
      maturityDate: body.maturityDate ? new Date(body.maturityDate) : null,
      referenceType: body.referenceType,
      referenceId: body.referenceId,
      counterparty: body.counterparty,
      dataQuality: body.dataQuality || 'complete',
      notes: body.notes,
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(exposure, { status: 201 });
}