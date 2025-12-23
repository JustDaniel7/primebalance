// src/app/api/risks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const severity = searchParams.get('severity');
  const includeResolved = searchParams.get('includeResolved') === 'true';

  const where: Record<string, unknown> = { organizationId: user.organizationId };

  if (status) where.status = status;
  if (severity) where.severity = severity;
  if (!includeResolved) {
    where.status = { notIn: ['resolved', 'accepted'] };
  }

  const risks = await prisma.risk.findMany({
    where,
    include: {
      mitigationSteps: { orderBy: { orderIndex: 'asc' } },
      linkedTasks: {
        include: {
          task: { select: { id: true, title: true, status: true } },
        },
      },
      comments: { take: 3, orderBy: { createdAt: 'desc' } },
    },
    orderBy: [{ severity: 'desc' }, { impactScore: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ risks });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.title) {
    return badRequest('title is required');
  }

  // Calculate impact score
  const severityScores: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 5 };
  const likelihoodScores: Record<string, number> = { rare: 1, unlikely: 2, possible: 3, likely: 4, almost_certain: 5 };
  const impactScore = (severityScores[body.severity] || 2) * (likelihoodScores[body.likelihood] || 3);

  const risk = await prisma.risk.create({
    data: {
      title: body.title,
      description: body.description,
      severity: body.severity || 'medium',
      likelihood: body.likelihood || 'possible',
      impactScore,
      status: body.status || 'identified',
      targetMitigationDate: body.targetMitigationDate ? new Date(body.targetMitigationDate) : null,
      ownerId: body.ownerId || user.id,
      ownerName: body.ownerName || user.name,
      impactAreas: body.impactAreas || [],
      affectedSystemId: body.affectedSystemId,
      affectedSystemName: body.affectedSystemName,
      affectedProjectId: body.affectedProjectId,
      affectedProjectName: body.affectedProjectName,
      blastRadius: body.blastRadius || 'isolated',
      mitigationPlan: body.mitigationPlan,
      sourceSystem: body.sourceSystem,
      sourceEntityId: body.sourceEntityId,
      organizationId: user.organizationId,
    },
  });

  // Add mitigation steps if provided
  if (body.mitigationSteps && Array.isArray(body.mitigationSteps)) {
    for (let i = 0; i < body.mitigationSteps.length; i++) {
      const step = body.mitigationSteps[i];
      await prisma.riskMitigationStep.create({
        data: {
          riskId: risk.id,
          description: step.description,
          orderIndex: i,
          ownerId: step.ownerId,
          ownerName: step.ownerName,
          deadline: step.deadline ? new Date(step.deadline) : null,
        },
      });
    }
  }

  // Create activity
  await prisma.riskActivity.create({
    data: {
      riskId: risk.id,
      type: 'created',
      actorId: user.id!,
      actorName: user.name || 'Unknown',
    },
  });

  const created = await prisma.risk.findUnique({
    where: { id: risk.id },
    include: { mitigationSteps: true },
  });

  return NextResponse.json(created, { status: 201 });
}