// src/app/api/liquidity/risks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (status) where.status = status;

  const signals = await prisma.liquidityRiskSignal.findMany({
    where,
    orderBy: [{ riskLevel: 'desc' }, { detectedAt: 'desc' }],
  });

  return NextResponse.json({ signals });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.type || !body.title || !body.description) {
    return badRequest('type, title, and description are required');
  }

  const signal = await prisma.liquidityRiskSignal.create({
    data: {
      type: body.type,
      title: body.title,
      description: body.description,
      riskLevel: body.riskLevel || 'moderate',
      metric: body.metric || 0,
      threshold: body.threshold || 0,
      breached: body.breached ?? (body.metric > body.threshold),
      affectedPeriod: body.affectedPeriod,
      relatedItems: body.relatedItems,
      status: 'active',
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(signal, { status: 201 });
}