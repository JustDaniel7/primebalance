// src/app/api/tasks/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const orgId = user.organizationId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  // Get all tasks
  const tasks = await prisma.task.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      status: true,
      priority: true,
      dueDate: true,
      completedAt: true,
      slaBreach: true,
      isBlocked: true,
    },
  });

  // Calculate summary
  const byStatus: Record<string, number> = {
    open: 0,
    in_progress: 0,
    blocked: 0,
    awaiting_review: 0,
    completed: 0,
    cancelled: 0,
    snoozed: 0,
  };

  const byPriority: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  let dueToday = 0;
  let overdue = 0;
  let dueSoon = 0;
  let blocked = 0;
  let needsReview = 0;
  let slaBreach = 0;
  let completedToday = 0;
  let completedThisWeek = 0;

  tasks.forEach((task) => {
    byStatus[task.status] = (byStatus[task.status] || 0) + 1;
    byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;

    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      if (dueDate >= today && dueDate < tomorrow && task.status !== 'completed') {
        dueToday++;
      }
      if (dueDate < today && task.status !== 'completed') {
        overdue++;
      }
      if (dueDate > today && dueDate <= weekFromNow && task.status !== 'completed') {
        dueSoon++;
      }
    }

    if (task.isBlocked) blocked++;
    if (task.status === 'awaiting_review') needsReview++;
    if (task.slaBreach) slaBreach++;

    if (task.completedAt) {
      const completedDate = new Date(task.completedAt);
      if (completedDate >= today) completedToday++;
      if (completedDate >= weekStart) completedThisWeek++;
    }
  });

  const summary = {
    total: tasks.length,
    byStatus,
    byPriority,
    dueToday,
    overdue,
    dueSoon,
    blocked,
    needsReview,
    slaBreach,
    completedToday,
    completedThisWeek,
  };

  return NextResponse.json(summary);
}