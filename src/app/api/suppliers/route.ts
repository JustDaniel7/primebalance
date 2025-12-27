// src/app/api/suppliers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (status && status !== 'all') where.status = status;
  if (category && category !== 'all') where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { supplierNumber: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const suppliers = await prisma.supplier.findMany({
    where,
    include: {
      contacts: true,
      balance: true,
      risks: { where: { status: { not: 'resolved' } } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ suppliers });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();
  if (!body.name || !body.email) {
    return badRequest('Name and email are required');
  }

  // Generate supplier number
  const count = await prisma.supplier.count({
    where: { organizationId: user.organizationId },
  });
  const supplierNumber = body.supplierNumber || `SUP-${String(count + 1).padStart(4, '0')}`;

  const supplier = await prisma.supplier.create({
    data: {
      supplierNumber,
      name: body.name,
      legalName: body.legalName,
      status: body.status || 'active',
      category: body.category || 'goods',
      email: body.email,
      phone: body.phone,
      website: body.website,
      address: body.address,
      taxId: body.taxId,
      registrationNumber: body.registrationNumber,
      founded: body.founded,
      employeeCount: body.employeeCount,
      accountManagerId: body.accountManagerId,
      accountManagerName: body.accountManagerName,
      tags: body.tags || [],
      supplierSince: body.supplierSince ? new Date(body.supplierSince) : new Date(),
      contractExpiryDate: body.contractExpiryDate ? new Date(body.contractExpiryDate) : null,
      paymentTerms: body.paymentTerms || 'Net 30',
      preferredPaymentMethod: body.preferredPaymentMethod || 'wire',
      earlyPaymentDiscount: body.earlyPaymentDiscount,
      bankDetails: body.bankDetails,
      reliabilityRating: body.reliabilityRating || 'good',
      dependencyLevel: body.dependencyLevel || 'low',
      notes: body.notes,
      organizationId: user.organizationId,
    },
    include: {
      contacts: true,
      balance: true,
    },
  });

  // Create default balance record
  await prisma.supplierBalance.create({
    data: { supplierId: supplier.id },
  });

  return NextResponse.json(supplier, { status: 201 });
}