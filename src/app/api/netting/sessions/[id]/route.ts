// src/app/api/netting/sessions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const session = await prisma.nettingSession.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      agreement: true,
      positions: {
        include: { transactions: true },
      },
      settlements: true,
    },
  });

  if (!session) return notFound('Netting Session');
  return NextResponse.json(session);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.nettingSession.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Netting Session');

  // Prevent updates to settled/cancelled sessions
  if (['settled', 'cancelled'].includes(existing.status)) {
    return badRequest('Cannot modify a settled or cancelled session');
  }

  const updated = await prisma.nettingSession.update({
    where: { id },
    data: body,
    include: { positions: true, settlements: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const existing = await prisma.nettingSession.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Netting Session');

  if (existing.status === 'settled') {
    return badRequest('Cannot delete a settled session');
  }

  await prisma.nettingSession.delete({ where: { id } });

  return NextResponse.json({ success: true });
}