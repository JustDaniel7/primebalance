// src/app/api/suppliers/[id]/risks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: supplierId } = await params;
  const body = await req.json();

  if (!body.title || !body.riskType) {
    return badRequest('Title and riskType are required');
  }

  // Verify supplier belongs to organization
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId: user.organizationId },
  });
  if (!supplier) return notFound('Supplier');

  const impactScore = body.impactScore || 5;
  const probabilityScore = body.probabilityScore || 5;

  const risk = await prisma.supplierRisk.create({
    data: {
      supplierId,
      riskType: body.riskType,
      title: body.title,
      description: body.description || '',
      severity: body.severity || 'medium',
      impactScore,
      probabilityScore,
      overallRiskScore: impactScore * probabilityScore,
      mitigationPlan: body.mitigationPlan,
      mitigationStatus: body.mitigationStatus || 'not_started',
      status: body.status || 'identified',
    },
  });

  return NextResponse.json(risk, { status: 201 });
}