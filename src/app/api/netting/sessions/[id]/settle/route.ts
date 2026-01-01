// src/app/api/netting/sessions/[id]/settle/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const organizationId = user.organizationId;

  const session = await prisma.nettingSession.findFirst({
    where: { id, organizationId },
    include: { settlements: true },
  });

  if (!session) return notFound('Netting Session');

  if (session.status !== 'approved') {
    return badRequest('Session must be approved before settlement');
  }

  // Use transaction to ensure atomicity and prevent double settlement
  const updated = await prisma.$transaction(async (tx) => {
    // Re-check status within transaction to prevent race conditions
    const currentSession = await tx.nettingSession.findFirst({
      where: { id, organizationId },
    });

    if (currentSession?.status !== 'approved') {
      throw new Error('SESSION_ALREADY_SETTLED');
    }

    // Mark all settlement instructions as completed
    await tx.settlementInstruction.updateMany({
      where: { sessionId: id, status: 'pending' },
      data: { status: 'completed', processedAt: new Date() },
    });

    // Update session status
    const updatedSession = await tx.nettingSession.update({
      where: { id },
      data: { status: 'settled' },
      include: { positions: true, settlements: true },
    });

    // Update agreement's last netting date
    await tx.nettingAgreement.update({
      where: { id: session.agreementId },
      data: { lastNettingDate: session.nettingDate },
    });

    return updatedSession;
  });

  return NextResponse.json(updated);
}