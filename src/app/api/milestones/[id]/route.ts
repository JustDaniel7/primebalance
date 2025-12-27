// src/app/api/milestones/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

// GET /api/milestones/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const milestone = await prisma.projectMilestone.findUnique({
    where: { id },
    include: {
      project: {
        select: { id: true, code: true, name: true, organizationId: true },
      },
    },
  });

  if (!milestone || milestone.project.organizationId !== user.organizationId) {
    return notFound('Milestone');
  }

  return NextResponse.json(milestone);
}

// PATCH /api/milestones/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.projectMilestone.findUnique({
    where: { id },
    include: {
      project: { select: { organizationId: true } },
    },
  });

  if (!existing || existing.project.organizationId !== user.organizationId) {
    return notFound('Milestone');
  }

  const wasCompleted = existing.status === 'completed';
  const willBeCompleted = body.status === 'completed';

  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.plannedDate !== undefined) updateData.plannedDate = new Date(body.plannedDate);
  if (body.actualDate !== undefined) updateData.actualDate = new Date(body.actualDate);
  if (body.status !== undefined) updateData.status = body.status;
  if (body.percentComplete !== undefined) updateData.percentComplete = body.percentComplete;
  if (body.isBillable !== undefined) updateData.isBillable = body.isBillable;
  if (body.billingAmount !== undefined) updateData.billingAmount = body.billingAmount;
  if (body.billedAt !== undefined) updateData.billedAt = new Date(body.billedAt);
  if (body.dependsOn !== undefined) updateData.dependsOn = body.dependsOn;

  // Auto-set actual date on completion
  if (willBeCompleted && !wasCompleted) {
    updateData.actualDate = new Date();
    updateData.percentComplete = 100;
  }

  const updated = await prisma.projectMilestone.update({
    where: { id },
    data: updateData,
  });

  // Update project milestone completed count
  if (willBeCompleted && !wasCompleted) {
    await prisma.project.update({
      where: { id: existing.projectId },
      data: { milestonesCompleted: { increment: 1 } },
    });
  } else if (!willBeCompleted && wasCompleted) {
    await prisma.project.update({
      where: { id: existing.projectId },
      data: { milestonesCompleted: { decrement: 1 } },
    });
  }

  return NextResponse.json(updated);
}

// DELETE /api/milestones/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const existing = await prisma.projectMilestone.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, organizationId: true } },
    },
  });

  if (!existing || existing.project.organizationId !== user.organizationId) {
    return notFound('Milestone');
  }

  await prisma.projectMilestone.delete({ where: { id } });

  // Update project counts
  await prisma.project.update({
    where: { id: existing.projectId },
    data: {
      milestoneCount: { decrement: 1 },
      ...(existing.status === 'completed' ? { milestonesCompleted: { decrement: 1 } } : {}),
    },
  });

  return NextResponse.json({ success: true });
}