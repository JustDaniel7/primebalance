// src/app/api/offers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

function addDays(date: string | Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const offer = await prisma.offer.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      versions: { orderBy: { version: 'desc' } },
      auditLogs: { orderBy: { timestamp: 'desc' }, take: 50 },
    },
  });

  if (!offer) return notFound('Offer');

  // Log view action
  await prisma.offerAuditLog.create({
    data: {
      offerId: offer.id,
      offerNumber: offer.offerNumber,
      action: 'viewed',
      details: `Offer ${offer.offerNumber} viewed`,
      userId: user.id,
      userName: user.name || 'Unknown',
    },
  });

  return NextResponse.json(offer);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.offer.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Offer');

  // Only draft/revised offers can be edited
  if (existing.status !== 'draft' && existing.status !== 'revised') {
    return badRequest('Only draft or revised offers can be edited');
  }

  // Recalculate totals if line items changed
  const updateData: Record<string, unknown> = { ...body, updatedBy: user.name || user.id };

  if (body.lineItems) {
    let subtotal = 0;
    let totalDiscount = 0;

    body.lineItems.forEach((item: Record<string, unknown>) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const itemSubtotal = qty * price;
      subtotal += itemSubtotal;
      
      if (item.discountType === 'percentage' && item.discountValue) {
        totalDiscount += itemSubtotal * (Number(item.discountValue) / 100);
      } else if (item.discountType === 'fixed' && item.discountValue) {
        totalDiscount += Number(item.discountValue);
      }
    });

    const taxRate = body.taxRate ?? Number(existing.taxRate);
    const taxableAmount = subtotal - totalDiscount;
    const taxTotal = taxableAmount * (taxRate / 100);
    const grandTotal = taxableAmount + taxTotal;

    updateData.subtotal = subtotal;
    updateData.totalDiscount = totalDiscount;
    updateData.taxTotal = taxTotal;
    updateData.grandTotal = grandTotal;
  }

  // Update expiry date if validity or offer date changed
  if (body.validityDays || body.offerDate) {
    const offerDate = body.offerDate ? new Date(body.offerDate) : existing.offerDate;
    const validityDays = body.validityDays || existing.validityDays;
    updateData.expiryDate = addDays(offerDate, validityDays);
  }

  // Convert dates
  if (body.offerDate) updateData.offerDate = new Date(body.offerDate);

  const updated = await prisma.offer.update({
    where: { id },
    data: updateData,
  });

  // Create audit log
  await prisma.offerAuditLog.create({
    data: {
      offerId: updated.id,
      offerNumber: updated.offerNumber,
      action: 'edited',
      details: 'Offer updated',
      userId: user.id,
      userName: user.name || 'Unknown',
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const existing = await prisma.offer.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Offer');

  // Only draft offers can be deleted
  if (existing.status !== 'draft') {
    return badRequest('Only draft offers can be deleted');
  }

  await prisma.offer.delete({ where: { id } });

  return NextResponse.json({ success: true });
}