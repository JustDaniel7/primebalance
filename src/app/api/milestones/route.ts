// src/app/api/milestones/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils';

// GET /api/milestones
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const status = searchParams.get('status');

  // Must specify a project
  if (!projectId) return badRequest('projectId is required');

  // Verify project belongs to org
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: user.organizationId },
  });

  if (!project) return notFound('Project');

  const where: Record<string, unknown> = { projectId };
  if (status) where.status = status;

  const milestones = await prisma.projectMilestone.findMany({
    where,
    orderBy: { plannedDate: 'asc' },
  });

  return NextResponse.json({ milestones });
}

// POST /api/milestones
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.projectId) return badRequest('projectId is required');
  if (!body.name) return badRequest('name is required');
  if (!body.plannedDate) return badRequest('plannedDate is required');

  // Verify project belongs to org
  const project = await prisma.project.findFirst({
    where: { id: body.projectId, organizationId: user.organizationId },
  });

  if (!project) return notFound('Project');

  const milestone = await prisma.projectMilestone.create({
    data: {
      projectId: body.projectId,
      name: body.name,
      description: body.description,
      plannedDate: new Date(body.plannedDate),
      status: 'pending',
      percentComplete: 0,
      isBillable: body.isBillable || false,
      billingAmount: body.billingAmount,
      dependsOn: body.dependsOn || [],
    },
  });

  // Update project milestone count
  await prisma.project.update({
    where: { id: body.projectId },
    data: { milestoneCount: { increment: 1 } },
  });

  return NextResponse.json(milestone, { status: 201 });
}