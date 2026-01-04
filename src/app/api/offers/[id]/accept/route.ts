// src/app/api/offers/[id]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';
import { notifyOfferAccepted } from '@/lib/notifications';

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
    return badRequest(`Cannot accept offer in ${offer.status} status`);
  }

  const updated = await prisma.offer.update({
    where: { id },
    data: {
      status: 'accepted',
      acceptedAt: new Date(),
      acceptanceMethod: body.method || 'email',
      approvedBy: user.name || user.id,
    },
  });

  await prisma.offerAuditLog.create({
    data: {
      offerId: updated.id,
      offerNumber: updated.offerNumber,
      action: 'accepted',
      details: `Offer ${updated.offerNumber} accepted via ${body.method || 'email'}`,
      previousStatus: offer.status,
      newStatus: 'accepted',
      userId: user.id,
      userName: user.name || 'Unknown',
    },
  });

  // Notify the offer creator
  if (offer.createdBy) {
    await notifyOfferAccepted({
      offerNumber: updated.offerNumber,
      customerName: updated.customerName || 'Unknown',
      amount: Number(updated.grandTotal),
      currency: updated.currency,
      recipientId: offer.createdBy,
      organizationId: user.organizationId,
    });
  }

  return NextResponse.json(updated);
}