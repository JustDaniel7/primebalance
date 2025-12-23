// src/app/api/offers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

function generateOfferNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `QUO-${year}-${random}`;
}

function addDays(date: string | Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (status && status !== 'all') where.status = status;
  if (search) {
    where.OR = [
      { offerNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const offers = await prisma.offer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ offers });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();
  
  if (!body.counterparty?.name) {
    return badRequest('Counterparty name is required');
  }

  const offerNumber = body.offerNumber || generateOfferNumber();
  const offerDate = body.offerDate ? new Date(body.offerDate) : new Date();
  const validityDays = body.validityDays || 30;
  const expiryDate = addDays(offerDate, validityDays);

  // Calculate totals from line items
  const lineItems = body.lineItems || [];
  let subtotal = 0;
  let totalDiscount = 0;

  lineItems.forEach((item: Record<string, unknown>) => {
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

  const taxRate = body.taxRate || 0;
  const taxableAmount = subtotal - totalDiscount;
  const taxTotal = taxableAmount * (taxRate / 100);
  const grandTotal = taxableAmount + taxTotal;

  const offer = await prisma.offer.create({
    data: {
      offerNumber,
      version: 1,
      status: 'draft',
      counterparty: body.counterparty,
      customerId: body.counterparty.id || null,
      customerName: body.counterparty.name,
      offerDate,
      validityDays,
      expiryDate,
      currency: body.currency || 'EUR',
      paymentTerms: body.paymentTerms || 'net_30',
      deliveryTerms: body.deliveryTerms,
      lineItems,
      subtotal,
      totalDiscount,
      taxTotal,
      grandTotal,
      taxRate,
      totalCost: body.totalCost,
      grossMargin: body.grossMargin,
      grossMarginPercent: body.grossMarginPercent,
      internalNotes: body.internalNotes,
      customerNotes: body.customerNotes,
      termsAndConditions: body.termsAndConditions,
      disclaimer: body.disclaimer || 'This offer is non-binding and subject to final confirmation.',
      templateId: body.templateId,
      templateName: body.templateName,
      createdBy: user.name || user.id,
      organizationId: user.organizationId,
    },
  });

  // Create audit log
  await prisma.offerAuditLog.create({
    data: {
      offerId: offer.id,
      offerNumber: offer.offerNumber,
      action: 'created',
      details: `Offer ${offer.offerNumber} created`,
      userId: user.id,
      userName: user.name || 'Unknown',
    },
  });

  return NextResponse.json(offer, { status: 201 });
}