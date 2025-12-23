// src/app/api/customers/[id]/risks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: customerId } = await params;
  const body = await req.json();

  if (!body.category || !body.indicator || !body.description) {
    return badRequest('category, indicator, and description are required');
  }

  // Verify customer belongs to organization
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId: user.organizationId },
  });
  if (!customer) return notFound('Customer');

  const risk = await prisma.customerRiskIndicator.create({
    data: {
      customerId,
      category: body.category,
      indicator: body.indicator,
      description: body.description,
      severity: body.severity || 'medium',
      score: body.score || 0,
      status: body.status || 'active',
      recommendedAction: body.recommendedAction,
    },
  });

  // Update customer risk level if needed
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

  return NextResponse.json(risk, { status: 201 });
}