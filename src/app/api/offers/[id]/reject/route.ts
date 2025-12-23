// src/app/api/offers/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const offer = await prisma.offer.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!offer) return notFound('Offer');

  if (offer.status !== 'sent' && offer.status !== 'revised') {
    return badRequest(`Cannot reject offer in ${offer.status} status`);
  }

  const updated = await prisma.offer.update({
    where: { id },
    data: {
      status: 'rejected',
      rejectedAt: new Date(),
      rejectionReason: body.reason,
    },
  });

  await prisma.offerAuditLog.create({
    data: {
      offerId: updated.id,
      offerNumber: updated.offerNumber,
      action: 'rejected',
      details: `Offer ${updated.offerNumber} rejected${body.reason ? `: ${body.reason}` : ''}`,
      previousStatus: offer.status,
      newStatus: 'rejected',
      userId: user.id,
      userName: user.name || 'Unknown',
    },
  });

  return NextResponse.json(updated);
}