// src/app/api/time-entries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

// GET /api/time-entries
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (projectId) where.projectId = projectId;
  if (userId) where.userId = userId;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate);
  }

  const timeEntries = await prisma.timeEntry.findMany({
    where,
    include: {
      project: { select: { id: true, code: true, name: true } },
      costCenter: { select: { id: true, code: true, name: true } },
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ timeEntries });
}

// POST /api/time-entries
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.projectId) return badRequest('projectId is required');
  if (!body.date) return badRequest('date is required');
  if (body.hours === undefined) return badRequest('hours is required');
  if (!body.description) return badRequest('description is required');

  // Verify project exists
  const project = await prisma.project.findFirst({
    where: { id: body.projectId, organizationId: user.organizationId },
  });

  if (!project) return badRequest('Project not found');

  // Calculate billable amount
  let billableAmount: number | undefined;
  if (body.isBillable && body.hourlyRate) {
    billableAmount = body.hours * body.hourlyRate;
  } else if (body.isBillable && project.billingRate) {
    billableAmount = body.hours * Number(project.billingRate);
  }

  // Calculate cost amount
  let costAmount: number | undefined;
  if (body.costRate) {
    costAmount = body.hours * body.costRate;
  }

  const entry = await prisma.timeEntry.create({
    data: {
      userId: body.userId || user.id!,
      userName: body.userName || user.name,
      projectId: body.projectId,
      projectCode: project.code,
      taskId: body.taskId,
      taskName: body.taskName,
      costCenterId: body.costCenterId || project.costCenterId,
      date: new Date(body.date),
      hours: body.hours,
      startTime: body.startTime,
      endTime: body.endTime,
      description: body.description,
      category: body.category,
      isBillable: body.isBillable || project.isBillable,
      hourlyRate: body.hourlyRate || (project.billingRate ? Number(project.billingRate) : null),
      billableAmount,
      costRate: body.costRate,
      costAmount,
      status: 'draft',
      organizationId: user.organizationId,
    },
    include: {
      project: { select: { id: true, code: true, name: true } },
    },
  });

  return NextResponse.json(entry, { status: 201 });
}