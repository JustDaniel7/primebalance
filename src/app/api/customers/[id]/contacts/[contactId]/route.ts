// src/app/api/customers/[id]/contacts/[contactId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string; contactId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: customerId, contactId } = await params;
  const body = await req.json();

  // Verify customer belongs to organization
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId: user.organizationId },
  });
  if (!customer) return notFound('Customer');

  // If setting as primary, unset other primaries
  if (body.isPrimary) {
    await prisma.customerContact.updateMany({
      where: { customerId, isPrimary: true, id: { not: contactId } },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.customerContact.update({
    where: { id: contactId },
    data: body,
  });

  return NextResponse.json(contact);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: customerId, contactId } = await params;

  // Verify customer belongs to organization
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId: user.organizationId },
  });
  if (!customer) return notFound('Customer');

  await prisma.customerContact.delete({
    where: { id: contactId },
  });

  return NextResponse.json({ success: true });
}