// src/app/api/fx/conversions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const sourceCurrency = searchParams.get('source');
  const targetCurrency = searchParams.get('target');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (status) where.status = status;
  if (sourceCurrency) where.sourceCurrency = sourceCurrency;
  if (targetCurrency) where.targetCurrency = targetCurrency;

  const conversions = await prisma.fXConversion.findMany({
    where,
    orderBy: { conversionDate: 'desc' },
  });

  return NextResponse.json({ conversions });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.sourceCurrency || !body.targetCurrency || !body.sourceAmount || !body.appliedRate) {
    return badRequest('sourceCurrency, targetCurrency, sourceAmount, and appliedRate are required');
  }

  // Generate conversion number
  const year = new Date().getFullYear();
  const count = await prisma.fXConversion.count({
    where: { organizationId: user.organizationId },
  });
  const conversionNumber = `FXC-${year}-${String(count + 1).padStart(4, '0')}`;

  const targetAmount = body.sourceAmount * body.appliedRate;
  const spreadCost = body.spreadCost || 0;
  const feeCost = body.feeCost || 0;
  const totalCost = spreadCost + feeCost;
  const effectiveRate = body.sourceAmount > 0 ? (targetAmount - totalCost) / body.sourceAmount : body.appliedRate;

  const conversion = await prisma.fXConversion.create({
    data: {
      conversionNumber,
      sourceCurrency: body.sourceCurrency,
      targetCurrency: body.targetCurrency,
      sourceAmount: body.sourceAmount,
      targetAmount,
      appliedRate: body.appliedRate,
      referenceRate: body.referenceRate,
      rateDeviation: body.referenceRate ? ((body.appliedRate - body.referenceRate) / body.referenceRate) * 100 : null,
      rateSource: body.rateSource || 'bank',
      spreadCost,
      feeCost,
      totalCost,
      effectiveRate,
      executionChannel: body.executionChannel,
      counterparty: body.counterparty,
      conversionDate: body.conversionDate ? new Date(body.conversionDate) : new Date(),
      valueDate: body.valueDate ? new Date(body.valueDate) : new Date(),
      settlementDate: body.settlementDate ? new Date(body.settlementDate) : null,
      status: 'pending',
      purpose: body.purpose,
      relatedDocuments: body.relatedDocuments || [],
      initiatedBy: user.name || user.id,
      organizationId: user.organizationId,
    },
  });

  // Log conversion creation
  await prisma.fXAuditLog.create({
    data: {
      action: 'conversion_create',
      category: 'conversion',
      details: `Conversion ${conversionNumber} created: ${body.sourceAmount} ${body.sourceCurrency} → ${body.targetCurrency}`,
      userId: user.id,
      userName: user.name || 'Unknown',
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(conversion, { status: 201 });
}