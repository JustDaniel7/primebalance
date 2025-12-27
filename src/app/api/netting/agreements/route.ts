// src/app/api/netting/agreements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (status) where.status = status;
  if (type) where.type = type;

  const agreements = await prisma.nettingAgreement.findMany({
    where,
    include: {
      parties: true,
      sessions: {
        orderBy: { nettingDate: 'desc' },
        take: 5,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ agreements });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.name || !body.effectiveDate) {
    return badRequest('name and effectiveDate are required');
  }

  // Generate agreement number
  const year = new Date().getFullYear();
  const count = await prisma.nettingAgreement.count({
    where: { organizationId: user.organizationId },
  });
  const agreementNumber = `NA-${year}-${String(count + 1).padStart(3, '0')}`;

  const agreement = await prisma.nettingAgreement.create({
    data: {
      agreementNumber,
      name: body.name,
      type: body.type || 'counterparty',
      status: body.status || 'active',
      nettingFrequency: body.nettingFrequency || 'monthly',
      settlementDays: body.settlementDays || 5,
      baseCurrency: body.baseCurrency || 'EUR',
      minimumNettingAmount: body.minimumNettingAmount,
      maximumNettingAmount: body.maximumNettingAmount,
      effectiveDate: new Date(body.effectiveDate),
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      nextNettingDate: body.nextNettingDate ? new Date(body.nextNettingDate) : null,
      notes: body.notes,
      organizationId: user.organizationId,
    },
  });

  // Create parties if provided
  if (body.parties && Array.isArray(body.parties)) {
    for (const party of body.parties) {
      await prisma.nettingParty.create({
        data: {
          partyId: party.partyId,
          partyName: party.partyName,
          partyType: party.partyType || 'supplier',
          accountNumber: party.accountNumber,
          bankName: party.bankName,
          bankDetails: party.bankDetails,
          isNettingCenter: party.isNettingCenter || false,
          agreementId: agreement.id,
        },
      });
    }
  }

  const created = await prisma.nettingAgreement.findUnique({
    where: { id: agreement.id },
    include: { parties: true },
  });

  return NextResponse.json(created, { status: 201 });
}