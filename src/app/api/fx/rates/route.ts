// src/app/api/fx/rates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const baseCurrency = searchParams.get('base');
  const quoteCurrency = searchParams.get('quote');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (baseCurrency) where.baseCurrency = baseCurrency;
  if (quoteCurrency) where.quoteCurrency = quoteCurrency;

  const rates = await prisma.fXRate.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: 50,
  });

  return NextResponse.json({
    rates: rates.map((r) => ({
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
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.baseCurrency || !body.quoteCurrency || !body.rate) {
    return badRequest('baseCurrency, quoteCurrency, and rate are required');
  }

  const rate = await prisma.fXRate.create({
    data: {
      baseCurrency: body.baseCurrency,
      quoteCurrency: body.quoteCurrency,
      rate: body.rate,
      inverseRate: body.inverseRate || 1 / body.rate,
      source: body.source || 'manual',
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      spread: body.spread,
      organizationId: user.organizationId,
    },
  });

  // Log rate creation
  await prisma.fXAuditLog.create({
    data: {
      action: 'rate_create',
      category: 'rate',
      details: `Rate created: ${body.baseCurrency}/${body.quoteCurrency} = ${body.rate}`,
      userId: user.id,
      userName: user.name || 'Unknown',
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(rate, { status: 201 });
}