// src/app/api/netting/offsets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const partyId = searchParams.get('partyId');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (status) where.status = status;
  if (partyId) where.partyId = partyId;

  const offsets = await prisma.offsetEntry.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ offsets });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.partyId || !body.sourceDocumentNumber || !body.targetDocumentNumber || !body.offsetAmount) {
    return badRequest('partyId, sourceDocumentNumber, targetDocumentNumber, and offsetAmount are required');
  }

  // Generate offset number
  const year = new Date().getFullYear();
  const count = await prisma.offsetEntry.count({
    where: { organizationId: user.organizationId },
  });
  const offsetNumber = `OFF-${year}-${String(count + 1).padStart(3, '0')}`;

  const offset = await prisma.offsetEntry.create({
    data: {
      offsetNumber,
      type: body.type || 'ar_ap',
      status: 'draft',
      partyId: body.partyId,
      partyName: body.partyName,
      partyType: body.partyType || 'customer',
      sourceDocumentType: body.sourceDocumentType || 'Credit Note',
      sourceDocumentNumber: body.sourceDocumentNumber,
      sourceAmount: body.sourceAmount,
      targetDocumentType: body.targetDocumentType || 'Invoice',
      targetDocumentNumber: body.targetDocumentNumber,
      targetAmount: body.targetAmount,
      offsetAmount: body.offsetAmount,
      currency: body.currency || 'EUR',
      offsetDate: body.offsetDate ? new Date(body.offsetDate) : new Date(),
      effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : new Date(),
      notes: body.notes,
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(offset, { status: 201 });
}