// src/app/api/tasks/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: { id, organizationId: user.organizationId },
    select: { id: true },
  });

  if (!task) return notFound('Task');

  const comments = await prisma.taskComment.findMany({
    where: { taskId: id, parentId: null },
    include: {
      replies: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  if (!body.content) {
    return badRequest('content is required');
  }

  const task = await prisma.task.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!task) return notFound('Task');

  // Extract mentions from content (e.g., @userId)
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(body.content)) !== null) {
    mentions.push(match[1]);
  }

  const comment = await prisma.taskComment.create({
    data: {
      taskId: id,
      content: body.content,
      authorId: user.id!,
      authorName: user.name || 'Unknown',
      parentId: body.parentId,
      mentions,
    },
  });

  // Create activity
  await prisma.taskActivity.create({
    data: {
      taskId: id,
      type: 'commented',
      actorId: user.id!,
      actorName: user.name || 'Unknown',
      details: { commentId: comment.id },
    },
  });

  // Update task flags
  await prisma.task.update({
    where: { id },
    data: {
      hasUnreadUpdates: true,
      hasMentions: mentions.length > 0,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}