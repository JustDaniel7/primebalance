// src/app/api/scenarios/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const scenario = await prisma.scenario.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      assumptions: { orderBy: { category: 'asc' } },
      comments: { orderBy: { createdAt: 'desc' } },
      decisions: { orderBy: { decidedAt: 'desc' } },
      changeEvents: { orderBy: { timestamp: 'desc' }, take: 50 },
    },
  });

  if (!scenario) return notFound('Scenario');
  return NextResponse.json(scenario);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.scenario.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Scenario');

  // Cannot edit locked scenarios
  if (existing.status === 'locked' && !body.forceUnlock) {
    return badRequest('Cannot edit a locked scenario');
  }

  const updated = await prisma.scenario.update({
    where: { id },
    data: {
      ...body,
      lastModifiedBy: user.name || user.id,
    },
    include: { assumptions: true },
  });

  // Log status change if applicable
  if (body.status && body.status !== existing.status) {
    await prisma.scenarioChangeEvent.create({
      data: {
        scenarioId: id,
        changeType: 'status_changed',
        previousStatus: existing.status,
        newStatus: body.status,
        description: `Status changed from ${existing.status} to ${body.status}`,
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

  const { id } = await params;

  const existing = await prisma.scenario.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Scenario');

  // Cannot delete locked or approved scenarios
  if (existing.status === 'locked' || existing.status === 'approved') {
    return badRequest('Cannot delete a locked or approved scenario');
  }

  await prisma.scenario.delete({ where: { id } });

  return NextResponse.json({ success: true });
}