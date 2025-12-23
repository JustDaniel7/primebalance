// src/app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const riskLevel = searchParams.get('riskLevel');
  const search = searchParams.get('search');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (status && status !== 'all') where.status = status;
  if (type && type !== 'all') where.type = type;
  if (riskLevel && riskLevel !== 'all') where.riskLevel = riskLevel;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { customerNumber: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      contacts: true,
      riskIndicators: { where: { status: 'active' } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ customers });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();
  if (!body.name) {
    return badRequest('Name is required');
  }

  // Generate customer number
  const count = await prisma.customer.count({
    where: { organizationId: user.organizationId },
  });
  const customerNumber = body.customerNumber || `CUS-${String(count + 1).padStart(5, '0')}`;

  const customer = await prisma.customer.create({
    data: {
      customerNumber,
      name: body.name,
      legalName: body.legalName,
      type: body.type || 'business',
      status: body.status || 'active',
      industry: body.industry,
      email: body.email,
      phone: body.phone,
      website: body.website,
      address: body.address,
      taxId: body.taxId,
      vatNumber: body.vatNumber,
      registrationNumber: body.registrationNumber,
      classification: body.classification,
      employeeCount: body.employeeCount,
      annualRevenue: body.annualRevenue,
      accountManagerId: body.accountManagerId,
      accountManagerName: body.accountManagerName,
      segment: body.segment,
      tags: body.tags || [],
      creditLimit: body.creditLimit || 0,
      creditAvailable: body.creditLimit || 0,
      creditStatus: body.creditStatus || 'approved',
      paymentTerms: body.paymentTerms || 'Net 30',
      paymentBehavior: body.paymentBehavior || 'good',
      riskLevel: body.riskLevel || 'low',
      preferredPaymentMethod: body.preferredPaymentMethod,
      preferredLanguage: body.preferredLanguage || 'en',
      invoiceDelivery: body.invoiceDelivery || 'email',
      notes: body.notes,
      organizationId: user.organizationId,
    },
    include: {
      contacts: true,
      riskIndicators: true,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}