// src/app/api/suppliers/[id]/contacts/[contactId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string; contactId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: supplierId, contactId } = await params;
  const body = await req.json();

  // Verify supplier belongs to organization
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId: user.organizationId },
  });
  if (!supplier) return notFound('Supplier');

  // If setting as primary, unset other primaries
  if (body.isPrimary) {
    await prisma.supplierContact.updateMany({
      where: { supplierId, isPrimary: true, id: { not: contactId } },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.supplierContact.update({
    where: { id: contactId },
    data: body,
  });

  return NextResponse.json(contact);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: supplierId, contactId } = await params;

  // Verify supplier belongs to organization
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId: user.organizationId },
  });
  if (!supplier) return notFound('Supplier');

  await prisma.supplierContact.delete({
    where: { id: contactId },
  });

  return NextResponse.json({ success: true });
}