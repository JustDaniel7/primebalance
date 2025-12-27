// src/app/api/customers/[id]/risks/[riskId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string; riskId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: customerId, riskId } = await params;
  const body = await req.json();

  // Verify customer belongs to organization
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId: user.organizationId },
  });
  if (!customer) return notFound('Customer');

  const updateData: Record<string, unknown> = { ...body };
  
  // Set resolvedAt if status changed to resolved
  if (body.status === 'resolved') {
    updateData.resolvedAt = new Date();
  }

  const risk = await prisma.customerRiskIndicator.update({
    where: { id: riskId },
    data: updateData,
  });

  // Recalculate customer risk level
  const activeRisks = await prisma.customerRiskIndicator.findMany({
    where: { customerId, status: 'active' },
  });
  
  const criticalCount = activeRisks.filter((r) => r.severity === 'critical').length;
  const highCount = activeRisks.filter((r) => r.severity === 'high').length;
  
  let newRiskLevel = 'low';
  if (criticalCount > 0) newRiskLevel = 'critical';
  else if (highCount > 0) newRiskLevel = 'high';
  else if (activeRisks.length > 2) newRiskLevel = 'medium';

  await prisma.customer.update({
    where: { id: customerId },
    data: { riskLevel: newRiskLevel, riskScore: activeRisks.reduce((sum, r) => sum + r.score, 0) },
  });

  return NextResponse.json(risk);
}