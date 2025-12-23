// src/app/api/offers/[id]/duplicate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const original = await prisma.offer.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!original) return notFound('Offer');

  // Generate new offer number
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const offerNumber = `QUO-${year}-${random}`;

  const now = new Date();
  const expiryDate = addDays(now, original.validityDays);

  const duplicate = await prisma.offer.create({
    data: {
      offerNumber,
      version: 1,
      status: 'draft',
      counterparty: original.counterparty as object,
      customerId: original.customerId,
      customerName: original.customerName,
      offerDate: now,
      validityDays: original.validityDays,
      expiryDate,
      currency: original.currency,
      paymentTerms: original.paymentTerms,
      deliveryTerms: original.deliveryTerms,
      lineItems: original.lineItems as object,
      subtotal: original.subtotal,
      totalDiscount: original.totalDiscount,
      taxTotal: original.taxTotal,
      grandTotal: original.grandTotal,
      taxRate: original.taxRate,
      totalCost: original.totalCost,
      grossMargin: original.grossMargin,
      grossMarginPercent: original.grossMarginPercent,
      internalNotes: original.internalNotes,
      customerNotes: original.customerNotes,
      termsAndConditions: original.termsAndConditions,
      disclaimer: original.disclaimer,
      templateId: original.templateId,
      templateName: original.templateName,
      createdBy: user.name || user.id,
      organizationId: user.organizationId,
    },
  });

  await prisma.offerAuditLog.create({
    data: {
      offerId: duplicate.id,
      offerNumber: duplicate.offerNumber,
      action: 'created',
      details: `Offer duplicated from ${original.offerNumber}`,
      userId: user.id,
      userName: user.name || 'Unknown',
    },
  });

  return NextResponse.json(duplicate, { status: 201 });
}