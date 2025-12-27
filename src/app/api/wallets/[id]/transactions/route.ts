// src/app/api/wallets/[id]/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

// GET /api/wallets/[id]/transactions
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const wallet = await prisma.wallet.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
  }

  const where: Record<string, unknown> = { walletId: id };
  if (type) where.type = type;

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, limit, offset });
}

// POST /api/wallets/[id]/transactions - Manually add transaction
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const wallet = await prisma.wallet.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
  }

  if (!body.hash || !body.type || body.value === undefined) {
    return NextResponse.json(
      { error: 'hash, type, and value are required' },
      { status: 400 }
    );
  }

  const transaction = await prisma.walletTransaction.create({
    data: {
      hash: body.hash,
      blockNumber: body.blockNumber,
      network: wallet.network,
      type: body.type,
      status: body.status || 'confirmed',
      fromAddress: body.fromAddress || wallet.address,
      toAddress: body.toAddress,
      isIncoming: body.isIncoming || false,
      value: body.value,
      valueUsd: body.valueUsd,
      tokenSymbol: body.tokenSymbol,
      tokenAddress: body.tokenAddress,
      gasUsed: body.gasUsed,
      gasPrice: body.gasPrice,
      gasCostUsd: body.gasCostUsd,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      methodName: body.methodName,
      description: body.description,
      notes: body.notes,
      tags: body.tags || [],
      walletId: id,
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}