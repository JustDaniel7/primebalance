// src/app/api/investor/investors/route.ts
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

  const investors = await prisma.investor.findMany({
    where,
    include: {
      investments: { orderBy: { investmentDate: 'desc' } },
      updates: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
    orderBy: { totalInvested: 'desc' },
  });

  return NextResponse.json({ investors });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.name) return badRequest('Investor name is required');

  const investor = await prisma.investor.create({
    data: {
      name: body.name,
      type: body.type || 'institutional',
      status: body.status || 'prospect',
      email: body.email,
      phone: body.phone,
      primaryContact: body.primaryContact,
      address: body.address,
      currency: body.currency || 'EUR',
      totalInvested: body.totalInvested || 0,
      currentValue: body.currentValue || 0,
      ownershipPercent: body.ownershipPercent || 0,
      unrealizedGain: body.unrealizedGain || 0,
      distributionsReceived: body.distributionsReceived || 0,
      investmentDate: body.investmentDate ? new Date(body.investmentDate) : null,
      boardSeat: body.boardSeat || false,
      votingRights: body.votingRights,
      liquidationPref: body.liquidationPref,
      lastContactDate: body.lastContactDate ? new Date(body.lastContactDate) : null,
      reportingFrequency: body.reportingFrequency || 'quarterly',
      tags: body.tags || [],
      notes: body.notes,
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(investor, { status: 201 });
}