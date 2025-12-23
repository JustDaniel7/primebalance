// src/app/api/risks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const risk = await prisma.risk.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      mitigationSteps: { orderBy: { orderIndex: 'asc' } },
      linkedTasks: { include: { task: true } },
      comments: { orderBy: { createdAt: 'desc' } },
      activities: { orderBy: { timestamp: 'desc' }, take: 20 },
    },
  });

  if (!risk) return notFound('Risk');
  return NextResponse.json(risk);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.risk.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Risk');

  // Track status change
  const statusChanged = body.status && body.status !== existing.status;
  const previousStatus = existing.status;

  // Recalculate impact score if severity/likelihood changed
  if (body.severity || body.likelihood) {
    const severityScores: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 5 };
    const likelihoodScores: Record<string, number> = { rare: 1, unlikely: 2, possible: 3, likely: 4, almost_certain: 5 };
    body.impactScore = (severityScores[body.severity || existing.severity] || 2) *
      (likelihoodScores[body.likelihood || existing.likelihood] || 3);
  }

  // Handle resolution
  if (body.status === 'resolved' && existing.status !== 'resolved') {
    body.resolvedAt = new Date();
  }

  const updated = await prisma.risk.update({
    where: { id },
    data: {
      ...body,
      targetMitigationDate: body.targetMitigationDate ? new Date(body.targetMitigationDate) : undefined,
      lastUpdatedAt: new Date(),
    },
    include: { mitigationSteps: true },
  });

  // Create activity for status change
  if (statusChanged) {
    await prisma.riskActivity.create({
      data: {
        riskId: id,
        type: 'status_changed',
        actorId: user.id!,
        actorName: user.name || 'Unknown',
        previousValue: previousStatus,
        newValue: body.status,
      },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const existing = await prisma.risk.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Risk');

  await prisma.risk.delete({ where: { id } });

  return NextResponse.json({ success: true });
}