// src/app/api/netting/agreements/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const agreement = await prisma.nettingAgreement.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      parties: true,
      sessions: {
        orderBy: { nettingDate: 'desc' },
        include: { positions: true },
      },
    },
  });

  if (!agreement) return notFound('Netting Agreement');
  return NextResponse.json(agreement);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.nettingAgreement.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Netting Agreement');

  const updated = await prisma.nettingAgreement.update({
    where: { id },
    data: body,
    include: { parties: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const existing = await prisma.nettingAgreement.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Netting Agreement');

  await prisma.nettingAgreement.delete({ where: { id } });

  return NextResponse.json({ success: true });
}