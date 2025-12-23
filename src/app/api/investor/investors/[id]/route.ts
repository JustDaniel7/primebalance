// src/app/api/investor/investors/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const investor = await prisma.investor.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      investments: { orderBy: { investmentDate: 'desc' } },
      updates: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!investor) return notFound('Investor');
  return NextResponse.json(investor);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.investor.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Investor');

  const updated = await prisma.investor.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const existing = await prisma.investor.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Investor');

  await prisma.investor.delete({ where: { id } });

  return NextResponse.json({ success: true });
}