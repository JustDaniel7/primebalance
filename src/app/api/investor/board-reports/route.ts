// src/app/api/investor/board-reports/route.ts
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

  const reports = await prisma.boardReport.findMany({
    where,
    orderBy: { asOfDate: 'desc' },
  });

  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.title || !body.periodCovered) {
    return badRequest('title and periodCovered are required');
  }

  const report = await prisma.boardReport.create({
    data: {
      title: body.title,
      periodCovered: body.periodCovered,
      asOfDate: body.asOfDate ? new Date(body.asOfDate) : new Date(),
      financialHealthStatus: body.financialHealthStatus || 'stable',
      liquidityStatus: body.liquidityStatus,
      sustainabilityOutlook: body.sustainabilityOutlook,
      keyHighlights: body.keyHighlights || [],
      materialChanges: body.materialChanges || [],
      riskFactors: body.riskFactors || [],
      dataLimitations: body.dataLimitations || [],
      concentrationRisks: body.concentrationRisks || [],
      snapshotId: body.snapshotId,
      status: 'draft',
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(report, { status: 201 });
}