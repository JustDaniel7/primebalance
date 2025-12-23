// src/app/api/scenarios/[id]/lock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const scenario = await prisma.scenario.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!scenario) return notFound('Scenario');
  if (scenario.status === 'locked') {
    return badRequest('Scenario is already locked');
  }

  const updated = await prisma.scenario.update({
    where: { id },
    data: {
      status: 'locked',
      lockedAt: new Date(),
      lockedBy: user.name || user.id,
      lastModifiedBy: user.name || user.id,
    },
  });

  await prisma.scenarioChangeEvent.create({
    data: {
      scenarioId: id,
      changeType: 'locked',
      previousStatus: scenario.status,
      newStatus: 'locked',
      description: `Scenario locked by ${user.name || user.id}`,
      userId: user.id,
      userName: user.name || 'Unknown',
    },
  });

  return NextResponse.json(updated);
}