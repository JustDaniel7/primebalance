// src/app/api/netting/sessions/[id]/settle/route.ts
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
    include: { settlements: true },
  });

  if (!session) return notFound('Netting Session');

  if (session.status !== 'approved') {
    return badRequest('Session must be approved before settlement');
  }

  // Mark all settlement instructions as completed
  await prisma.settlementInstruction.updateMany({
    where: { sessionId: id, status: 'pending' },
    data: { status: 'completed', processedAt: new Date() },
  });

  // Update session status
  const updated = await prisma.nettingSession.update({
    where: { id },
    data: { status: 'settled' },
    include: { positions: true, settlements: true },
  });

  // Update agreement's last netting date
  await prisma.nettingAgreement.update({
    where: { id: session.agreementId },
    data: { lastNettingDate: session.nettingDate },
  });

  return NextResponse.json(updated);
}