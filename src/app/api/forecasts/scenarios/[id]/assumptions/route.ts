// src/app/api/forecasts/scenarios/[id]/assumptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: scenarioId } = await params;
  const body = await req.json();

  if (!body.name) return badRequest('Assumption name is required');

  // Verify scenario belongs to organization
  const scenario = await prisma.forecastScenario.findFirst({
    where: { id: scenarioId, organizationId: user.organizationId },
  });
  if (!scenario) return notFound('Scenario');

  const assumption = await prisma.forecastAssumption.create({
    data: {
      name: body.name,
      category: body.category || 'other',
      value: body.value || 0,
      unit: body.unit || 'percentage',
      description: body.description,
      impactedForecasts: body.impactedForecasts || [],
      isEditable: body.isEditable ?? true,
      lastUpdatedBy: user.name || user.id,
      scenarioId,
    },
  });

  return NextResponse.json(assumption, { status: 201 });
}