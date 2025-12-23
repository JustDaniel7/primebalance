// src/app/api/suppliers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const supplier = await prisma.supplier.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      contacts: true,
      balance: true,
      payments: { orderBy: { paymentDate: 'desc' }, take: 20 },
      reliability: { orderBy: { orderDate: 'desc' }, take: 20 },
      spend: { orderBy: { period: 'desc' }, take: 12 },
      risks: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!supplier) return notFound('Supplier');
  return NextResponse.json(supplier);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  // Build update data, converting dates
  const updateData: Record<string, unknown> = { ...body };
  if (body.supplierSince) updateData.supplierSince = new Date(body.supplierSince);
  if (body.lastOrderDate) updateData.lastOrderDate = new Date(body.lastOrderDate);
  if (body.lastPaymentDate) updateData.lastPaymentDate = new Date(body.lastPaymentDate);
  if (body.contractExpiryDate) updateData.contractExpiryDate = new Date(body.contractExpiryDate);

  const result = await prisma.supplier.updateMany({
    where: { id, organizationId: user.organizationId },
    data: updateData,
  });

  if (result.count === 0) return notFound('Supplier');

  const updated = await prisma.supplier.findUnique({
    where: { id },
    include: {
      contacts: true,
      balance: true,
      risks: { where: { status: { not: 'resolved' } } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const result = await prisma.supplier.deleteMany({
    where: { id, organizationId: user.organizationId },
  });

  if (result.count === 0) return notFound('Supplier');
  return NextResponse.json({ success: true });
}