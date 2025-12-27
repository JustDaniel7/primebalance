// src/app/api/suppliers/[id]/risks/[riskId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string; riskId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: supplierId, riskId } = await params;
  const body = await req.json();

  // Verify supplier belongs to organization
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId: user.organizationId },
  });
  if (!supplier) return notFound('Supplier');

  const updateData: Record<string, unknown> = { ...body };
  
  // Recalculate risk score if impact or probability changed
  if (body.impactScore || body.probabilityScore) {
    const existing = await prisma.supplierRisk.findUnique({ where: { id: riskId } });
    if (existing) {
      const impact = body.impactScore || existing.impactScore;
      const prob = body.probabilityScore || existing.probabilityScore;
      updateData.overallRiskScore = impact * prob;
    }
  }

  // Set resolvedAt if status changed to resolved
  if (body.status === 'resolved') {
    updateData.resolvedAt = new Date();
  }

  const risk = await prisma.supplierRisk.update({
    where: { id: riskId },
    data: updateData,
  });

  return NextResponse.json(risk);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: supplierId, riskId } = await params;

  // Verify supplier belongs to organization
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId: user.organizationId },
  });
  if (!supplier) return notFound('Supplier');

  await prisma.supplierRisk.delete({
    where: { id: riskId },
  });

  return NextResponse.json({ success: true });
}