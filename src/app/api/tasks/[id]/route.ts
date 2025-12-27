// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      assignees: true,
      watchers: true,
      tags: { include: { tag: true } },
      comments: {
        orderBy: { createdAt: 'desc' },
        include: { replies: true },
      },
      activities: {
        orderBy: { timestamp: 'desc' },
        take: 20,
      },
      attachments: true,
      subtasks: true,
      dependencies: { include: { blockingTask: true } },
      dependents: { include: { dependentTask: true } },
      linkedRisks: { include: { risk: true } },
    },
  });

  if (!task) return notFound('Task');
  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.task.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Task');

  // Track status change for activity
  const statusChanged = body.status && body.status !== existing.status;
  const previousStatus = existing.status;

  // Handle completion
  if (body.status === 'completed' && existing.status !== 'completed') {
    body.completedAt = new Date();
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...body,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      slaDeadline: body.slaDeadline ? new Date(body.slaDeadline) : undefined,
      snoozedUntil: body.snoozedUntil ? new Date(body.snoozedUntil) : undefined,
    },
    include: {
      assignees: true,
      tags: { include: { tag: true } },
    },
  });

  // Create activity for status change
  if (statusChanged) {
    await prisma.taskActivity.create({
      data: {
        taskId: id,
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

  const existing = await prisma.task.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Task');

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ success: true });
}