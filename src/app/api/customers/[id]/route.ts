// src/app/api/customers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      contacts: true,
      payments: { orderBy: { paymentDate: 'desc' }, take: 50 },
      creditEvents: { orderBy: { createdAt: 'desc' }, take: 20 },
      revenueRecords: { orderBy: { period: 'desc' }, take: 24 },
      riskIndicators: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!customer) return notFound('Customer');
  return NextResponse.json(customer);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  // Build update data, converting dates
  const updateData: Record<string, unknown> = { ...body };
  const dateFields = ['customerSince', 'lastActivityDate', 'lastPurchaseDate', 'lastOrderDate', 'lastPaymentDate', 'lastContactDate'];
  dateFields.forEach((field) => {
    if (body[field]) updateData[field] = new Date(body[field]);
  });

  // Recalculate credit available if credit limit changed
  if (body.creditLimit !== undefined) {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (existing) {
      updateData.creditAvailable = body.creditLimit - Number(existing.creditUsed);
    }
  }

  const result = await prisma.customer.updateMany({
    where: { id, organizationId: user.organizationId },
    data: updateData,
  });

  if (result.count === 0) return notFound('Customer');

  const updated = await prisma.customer.findUnique({
    where: { id },
    include: {
      contacts: true,
      riskIndicators: { where: { status: 'active' } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const result = await prisma.customer.deleteMany({
    where: { id, organizationId: user.organizationId },
  });

  if (result.count === 0) return notFound('Customer');
  return NextResponse.json({ success: true });
}