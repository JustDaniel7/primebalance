// src/app/api/offers/[id]/revise/route.ts
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

  if (offer.status !== 'sent') {
    return badRequest(`Cannot revise offer in ${offer.status} status`);
  }

  // Create version snapshot
  await prisma.offerVersion.create({
    data: {
      offerId: offer.id,
      version: offer.version,
      changes: body.changes || [],
      revisionNotes: body.revisionNotes,
      snapshotData: {
        lineItems: offer.lineItems,
        subtotal: offer.subtotal,
        totalDiscount: offer.totalDiscount,
        taxTotal: offer.taxTotal,
        grandTotal: offer.grandTotal,
        paymentTerms: offer.paymentTerms,
        deliveryTerms: offer.deliveryTerms,
      },
      createdBy: user.name || user.id,
    },
  });

  // Update offer to revised status with incremented version
  const updated = await prisma.offer.update({
    where: { id },
    data: {
      status: 'revised',
      version: offer.version + 1,
      previousVersionId: `${offer.id}-v${offer.version}`,
      updatedBy: user.name || user.id,
    },
  });

  await prisma.offerAuditLog.create({
    data: {
      offerId: updated.id,
      offerNumber: updated.offerNumber,
      action: 'revised',
      details: `Offer revised to version ${updated.version}`,
      previousStatus: offer.status,
      newStatus: 'revised',
      userId: user.id,
      userName: user.name || 'Unknown',
      metadata: { revisionNotes: body.revisionNotes },
    },
  });

  return NextResponse.json(updated);
}