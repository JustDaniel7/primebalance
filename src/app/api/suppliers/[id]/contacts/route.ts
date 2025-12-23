// src/app/api/suppliers/[id]/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: supplierId } = await params;
  const body = await req.json();

  if (!body.name || !body.email) {
    return badRequest('Name and email are required');
  }

  // Verify supplier belongs to organization
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId: user.organizationId },
  });
  if (!supplier) return notFound('Supplier');

  // If setting as primary, unset other primaries
  if (body.isPrimary) {
    await prisma.supplierContact.updateMany({
      where: { supplierId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.supplierContact.create({
    data: {
      supplierId,
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