// src/app/api/scenarios/[id]/clone/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  if (!body.name) return badRequest('New scenario name is required');

  const original = await prisma.scenario.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { assumptions: true },
  });

  if (!original) return notFound('Scenario');

  // Create cloned scenario
  const cloned = await prisma.scenario.create({
    data: {
      name: body.name,
      description: body.description || original.description,
      caseType: 'custom',
      status: 'draft',
      visibility: 'personal',
      metrics: original.metrics as object,
      confidenceLevel: original.confidenceLevel,
      confidenceScore: original.confidenceScore,
      uncertaintyBandLow: original.uncertaintyBandLow,
      uncertaintyBandHigh: original.uncertaintyBandHigh,
      derivedFromId: original.id,
      derivedFromName: original.name,
      ownerId: user.id,
      ownerName: user.name || 'Unknown',
      sharedWithTeams: [],
      tags: original.tags,
      createdBy: user.name || user.id,
      organizationId: user.organizationId,
    },
  });

  // Clone assumptions
  for (const assumption of original.assumptions) {
    await prisma.scenarioAssumption.create({
      data: {
        name: assumption.name,
        category: assumption.category,
        baseValue: assumption.baseValue,
        currentValue: assumption.currentValue,
        unit: assumption.unit,
        description: assumption.description,
        isProtected: false, // Cloned assumptions are not protected
        minValue: assumption.minValue,
        maxValue: assumption.maxValue,
        step: assumption.step,
        impactedMetrics: assumption.impactedMetrics,
        scenarioId: cloned.id,
      },
    });
  }

  // Log clone event
  await prisma.scenarioChangeEvent.create({
    data: {
      scenarioId: cloned.id,
      changeType: 'cloned',
      description: `Cloned from "${original.name}"`,
      userId: user.id,
      userName: user.name || 'Unknown',
    },
  });

  const result = await prisma.scenario.findUnique({
    where: { id: cloned.id },
    include: { assumptions: true },
  });

  return NextResponse.json(result, { status: 201 });
}