// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';
import { notifyTaskAssignment } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const ownerId = searchParams.get('ownerId');
  const sourceSystem = searchParams.get('sourceSystem');
  const includeCompleted = searchParams.get('includeCompleted') === 'true';

  const where: Record<string, unknown> = { organizationId: user.organizationId };

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (ownerId) where.ownerId = ownerId;
  if (sourceSystem) where.sourceSystem = sourceSystem;
  if (!includeCompleted) {
    where.status = { notIn: ['completed', 'cancelled'] };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignees: true,
      tags: { include: { tag: true } },
      comments: { take: 3, orderBy: { createdAt: 'desc' } },
      attachments: { select: { id: true, name: true } },
      subtasks: { select: { id: true, title: true, status: true } },
      linkedRisks: { include: { risk: { select: { id: true, title: true, severity: true } } } },
      dependencies: { include: { blockingTask: { select: { id: true, title: true, status: true } } } },
    },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.title) {
    return badRequest('title is required');
  }

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description,
      status: body.status || 'open',
      priority: body.priority || 'medium',
      type: body.type || 'general',
      category: body.category,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      dueTime: body.dueTime,
      startDate: body.startDate ? new Date(body.startDate) : null,
      ownerId: body.ownerId || user.id,
      ownerName: body.ownerName || user.name,
      createdById: user.id,
      createdByName: user.name,
      assignmentReason: body.assignmentReason || 'direct_assignment',
      sourceSystem: body.sourceSystem || 'manual',
      sourceEntityId: body.sourceEntityId,
      sourceEntityType: body.sourceEntityType,
      slaDeadline: body.slaDeadline ? new Date(body.slaDeadline) : null,
      estimatedHours: body.estimatedHours,
      isRecurring: body.isRecurring || false,
      recurringInterval: body.recurringInterval,
      parentId: body.parentId,
      metadata: body.metadata,
      organizationId: user.organizationId,
    },
  });

  // Create activity
  await prisma.taskActivity.create({
    data: {
      taskId: task.id,
      type: 'created',
      actorId: user.id!,
      actorName: user.name || 'Unknown',
    },
  });

  // Add assignees if provided
  if (body.assigneeIds && Array.isArray(body.assigneeIds)) {
    for (const assigneeId of body.assigneeIds) {
      await prisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: assigneeId,
          assignedBy: user.id,
        },
      });
    }

    // Notify assignees about the new task
    await notifyTaskAssignment({
      taskId: task.id,
      taskTitle: task.title,
      assigneeIds: body.assigneeIds,
      actorId: user.id!,
      actorName: user.name || 'Someone',
      organizationId: user.organizationId,
    });
  }

  const created = await prisma.task.findUnique({
    where: { id: task.id },
    include: { assignees: true, tags: { include: { tag: true } } },
  });

  return NextResponse.json(created, { status: 201 });
}