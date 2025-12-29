// src/app/api/wallets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

// GET /api/wallets/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.id) return unauthorized();

  const { id } = await params;

  const wallet = await prisma.wallet.findFirst({
    where: { id, userId: user.id },
    include: {
      tokens: {
        orderBy: { balanceUsd: 'desc' },
      },
      transactions: {
        orderBy: { timestamp: 'desc' },
        take: 50,
      },
    },
  });

  if (!wallet) return notFound('Wallet');

  return NextResponse.json(wallet);
}

// PATCH /api/wallets/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.id) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.wallet.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) return notFound('Wallet');

  // If setting as default, unset other defaults
  if (body.isDefault === true) {
    await prisma.wallet.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.wallet.update({
    where: { id },
    data: {
      name: body.name,
      walletType: body.walletType,
      purpose: body.purpose,
      isActive: body.isActive,
      isWatching: body.isWatching,
      isDefault: body.isDefault,
      ens: body.ens,
      notes: body.notes,
      tags: body.tags,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/wallets/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.id) return unauthorized();

  const { id } = await params;

  const existing = await prisma.wallet.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) return notFound('Wallet');

  await prisma.wallet.delete({ where: { id } });

  return NextResponse.json({ success: true });
}