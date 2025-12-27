// src/app/api/scenarios/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const scenario = await prisma.scenario.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!scenario) return notFound('Scenario');
  if (scenario.status === 'approved') {
    return badRequest('Scenario is already approved');
  }

  const updated = await prisma.scenario.update({
    where: { id },
    data: {
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: user.name || user.id,
      lastModifiedBy: user.name || user.id,
    },
  });

  // Create decision record
  await prisma.scenarioDecision.create({
    data: {
      scenarioId: id,
      type: 'approved',
      decision: body.decision || 'Approved',
      rationale: body.rationale,
      decidedBy: user.id,
      decidedByName: user.name || 'Unknown',
    },
  });

  await prisma.scenarioChangeEvent.create({
    data: {
      scenarioId: id,
      changeType: 'approved',
      previousStatus: scenario.status,
      newStatus: 'approved',
      description: `Scenario approved by ${user.name || user.id}`,
      userId: user.id,
      userName: user.name || 'Unknown',
    },
  });

  return NextResponse.json(updated);
}