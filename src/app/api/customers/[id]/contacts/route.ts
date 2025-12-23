// src/app/api/customers/[id]/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: customerId } = await params;
  const body = await req.json();

  if (!body.name || !body.email) {
    return badRequest('Name and email are required');
  }

  // Verify customer belongs to organization
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId: user.organizationId },
  });
  if (!customer) return notFound('Customer');

  // If setting as primary, unset other primaries
  if (body.isPrimary) {
    await prisma.customerContact.updateMany({
      where: { customerId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.customerContact.create({
    data: {
      customerId,
      name: body.name,
      title: body.title,
      email: body.email,
      phone: body.phone,
      isPrimary: body.isPrimary || false,
      role: body.role || 'general',
      notes: body.notes,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}