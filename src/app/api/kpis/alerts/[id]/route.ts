// src/app/api/kpis/alerts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.kPIAlert.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('KPI Alert');

  const updates: Record<string, unknown> = {};

  if (body.isRead !== undefined) {
    updates.isRead = body.isRead;
    if (body.isRead) updates.readAt = new Date();
  }

  if (body.isDismissed !== undefined) {
    updates.isDismissed = body.isDismissed;
    if (body.isDismissed) {
      updates.dismissedAt = new Date();
      updates.dismissedBy = user.name || user.id;
    }
  }

  const updated = await prisma.kPIAlert.update({
    where: { id },
    data: updates,
  });

  return NextResponse.json(updated);
}