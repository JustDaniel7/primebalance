// src/app/api/netting/sessions/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const session = await prisma.nettingSession.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!session) return notFound('Netting Session');

  if (session.status !== 'pending_approval') {
    return badRequest('Session must be pending approval to approve');
  }

  const updated = await prisma.nettingSession.update({
    where: { id },
    data: {
      status: 'approved',
      approvedBy: user.id,
      approvedByName: user.name || 'Unknown',
      approvedAt: new Date(),
    },
    include: { positions: true, settlements: true },
  });

  return NextResponse.json(updated);
}