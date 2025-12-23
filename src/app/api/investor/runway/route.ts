// src/app/api/investor/runway/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const projections = await prisma.runwayProjection.findMany({
    where: { organizationId: user.organizationId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ projections });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.currentCash || !body.monthlyBurnRate) {
    return badRequest('currentCash and monthlyBurnRate are required');
  }

  // Calculate runway
  const runwayMonths = body.currentCash / body.monthlyBurnRate;
  const runwayEndDate = new Date();
  runwayEndDate.setMonth(runwayEndDate.getMonth() + Math.floor(runwayMonths));

  const projection = await prisma.runwayProjection.create({
    data: {
      name: body.name || `${body.scenarioType || 'base'} projection`,
      scenarioType: body.scenarioType || 'base',
      currentCash: body.currentCash,
      currency: body.currency || 'EUR',
      assumptions: body.assumptions || [],
      monthlyBurnRate: body.monthlyBurnRate,
      runwayMonths,
      runwayEndDate,
      confidenceLevel: body.confidenceLevel || 70,
      projectionBasis: body.projectionBasis || 'historical',
      timeHorizon: body.timeHorizon || '12_months',
      warnings: body.warnings,
      dataInputs: body.dataInputs || [],
      isActive: true,
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(projection, { status: 201 });
}