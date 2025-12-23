// src/app/api/time-entries/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

// GET /api/time-entries/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const entry = await prisma.timeEntry.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      project: { select: { id: true, code: true, name: true } },
      costCenter: { select: { id: true, code: true, name: true } },
    },
  });

  if (!entry) return notFound('Time Entry');

  return NextResponse.json(entry);
}

// PATCH /api/time-entries/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.timeEntry.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Time Entry');

  // Prevent editing approved/billed entries
  if (['approved', 'billed'].includes(existing.status) && !body.forceUpdate) {
    return badRequest('Cannot modify approved or billed time entries');
  }

  const updateData: Record<string, unknown> = {};

  // Basic fields
  if (body.date !== undefined) updateData.date = new Date(body.date);
  if (body.hours !== undefined) updateData.hours = body.hours;
  if (body.startTime !== undefined) updateData.startTime = body.startTime;
  if (body.endTime !== undefined) updateData.endTime = body.endTime;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.taskId !== undefined) updateData.taskId = body.taskId;
  if (body.taskName !== undefined) updateData.taskName = body.taskName;

  // Billing
  if (body.isBillable !== undefined) updateData.isBillable = body.isBillable;
  if (body.hourlyRate !== undefined) updateData.hourlyRate = body.hourlyRate;
  if (body.costRate !== undefined) updateData.costRate = body.costRate;

  // Recalculate amounts if hours or rates changed
  const hours = body.hours ?? Number(existing.hours);
  if (body.hours !== undefined || body.hourlyRate !== undefined) {
    const rate = body.hourlyRate ?? existing.hourlyRate;
    if (rate) updateData.billableAmount = hours * Number(rate);
  }
  if (body.hours !== undefined || body.costRate !== undefined) {
    const rate = body.costRate ?? existing.costRate;
    if (rate) updateData.costAmount = hours * Number(rate);
  }

  // Status changes
  if (body.status !== undefined) {
    updateData.status = body.status;

    if (body.status === 'approved') {
      updateData.approvedBy = user.name || user.id;
      updateData.approvedAt = new Date();
    } else if (body.status === 'rejected') {
      updateData.rejectionReason = body.rejectionReason;
    }
  }

  const updated = await prisma.timeEntry.update({
    where: { id },
    data: updateData,
    include: {
      project: { select: { id: true, code: true, name: true } },
    },
  });

  // Update project actual hours on approval
  if (body.status === 'approved' && existing.status !== 'approved') {
    await prisma.project.update({
      where: { id: existing.projectId },
      data: { actualHours: { increment: Number(existing.hours) } },
    });
  }

  return NextResponse.json(updated);
}

// DELETE /api/time-entries/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const existing = await prisma.timeEntry.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Time Entry');

  if (['approved', 'billed'].includes(existing.status)) {
    return badRequest('Cannot delete approved or billed time entries');
  }

  await prisma.timeEntry.delete({ where: { id } });

  return NextResponse.json({ success: true });
}