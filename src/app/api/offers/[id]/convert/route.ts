// src/app/api/offers/[id]/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const offer = await prisma.offer.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!offer) return notFound('Offer');

  if (offer.status !== 'accepted') {
    return badRequest('Only accepted offers can be converted to orders');
  }

  // Generate order number
  const year = new Date().getFullYear();
  const orderCount = await prisma.order.count({
    where: { organizationId: user.organizationId },
  });
  const orderNumber = `ORD-${year}-${String(orderCount + 1).padStart(4, '0')}`;
  const orderId = `ord-${Date.now()}`;

  const updated = await prisma.offer.update({
    where: { id },
    data: {
      status: 'converted',
      convertedAt: new Date(),
      convertedOrderId: orderId,
      convertedOrderNumber: orderNumber,
    },
  });

  await prisma.offerAuditLog.create({
    data: {
      offerId: updated.id,
      offerNumber: updated.offerNumber,
      action: 'converted',
      details: `Offer converted to Order ${orderNumber}`,
      previousStatus: 'accepted',
      newStatus: 'converted',
      userId: user.id,
      userName: user.name || 'Unknown',
      metadata: { orderId, orderNumber },
    },
  });

  return NextResponse.json({ offer: updated, orderNumber, orderId });
}