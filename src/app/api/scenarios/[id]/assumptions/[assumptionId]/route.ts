// src/app/api/scenarios/[id]/assumptions/[assumptionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string; assumptionId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: scenarioId, assumptionId } = await params;
  const body = await req.json();

  // Verify scenario
  const scenario = await prisma.scenario.findFirst({
    where: { id: scenarioId, organizationId: user.organizationId },
  });
  if (!scenario) return notFound('Scenario');
  if (scenario.status === 'locked') {
    return badRequest('Cannot edit assumptions in a locked scenario');
  }

  // Verify assumption
  const existing = await prisma.scenarioAssumption.findFirst({
    where: { id: assumptionId, scenarioId },
  });
  if (!existing) return notFound('Assumption');
  if (existing.isProtected && body.currentValue !== undefined) {
    return badRequest('Cannot modify a protected assumption');
  }

  // Track value change
  const previousValue = existing.currentValue;
  const newValue = body.currentValue ?? existing.currentValue;

  const updated = await prisma.scenarioAssumption.update({
    where: { id: assumptionId },
    data: {
      ...body,
      isOverridden: body.currentValue !== undefined && body.currentValue !== Number(existing.baseValue),
      lastModifiedAt: new Date(),
      lastModifiedBy: user.name || user.id,
    },
  });

  // Log change event if value changed
  if (body.currentValue !== undefined && body.currentValue !== Number(previousValue)) {
    await prisma.scenarioChangeEvent.create({
      data: {
        scenarioId,
        changeType: 'assumption_changed',
        assumptionId,
        assumptionName: existing.name,
        previousValue,
        newValue,
        description: `${existing.name} changed from ${previousValue} to ${newValue}`,
        userId: user.id,
        userName: user.name || 'Unknown',
      },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: scenarioId, assumptionId } = await params;

  // Verify scenario
  const scenario = await prisma.scenario.findFirst({
    where: { id: scenarioId, organizationId: user.organizationId },
  });
  if (!scenario) return notFound('Scenario');
  if (scenario.status === 'locked') {
    return badRequest('Cannot delete assumptions from a locked scenario');
  }

  await prisma.scenarioAssumption.deleteMany({
    where: { id: assumptionId, scenarioId },
  });

  return NextResponse.json({ success: true });
}