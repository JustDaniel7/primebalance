// src/app/api/wallets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

// GET /api/wallets - List all wallets for user
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.id) return unauthorized();

  const { searchParams } = new URL(req.url);
  const network = searchParams.get('network');
  const isActive = searchParams.get('isActive');

  const where: Record<string, unknown> = { userId: user.id };
  if (network) where.network = network;
  if (isActive !== null) where.isActive = isActive === 'true';

  const wallets = await prisma.wallet.findMany({
    where,
    include: {
      tokens: {
        where: { isHidden: false, isSpam: false },
        orderBy: { balanceUsd: 'desc' },
      },
      _count: { select: { transactions: true } },
    },
    orderBy: [{ isDefault: 'desc' }, { totalValueUsd: 'desc' }, { createdAt: 'asc' }],
  });

  // Calculate totals
  const totalValueUsd = wallets.reduce((sum, w) => sum + Number(w.totalValueUsd), 0);
  const byNetwork: Record<string, { count: number; valueUsd: number }> = {};

  wallets.forEach((w) => {
    if (!byNetwork[w.network]) {
      byNetwork[w.network] = { count: 0, valueUsd: 0 };
    }
    byNetwork[w.network].count++;
    byNetwork[w.network].valueUsd += Number(w.totalValueUsd);
  });

  return NextResponse.json({
    wallets,
    summary: {
      totalWallets: wallets.length,
      totalValueUsd,
      byNetwork,
    },
  });
}

// POST /api/wallets - Add a new wallet
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.id) return unauthorized();

  const body = await req.json();

  if (!body.address) return badRequest('address is required');
  if (!body.network) return badRequest('network is required');

  // Normalize address
  const address = body.address.toLowerCase();

  // Check for duplicate
  const existing = await prisma.wallet.findUnique({
    where: {
      userId_address_network: {
        userId: user.id,
        address,
        network: body.network,
      },
    },
  });

  if (existing) {
    return badRequest('Wallet already exists');
  }

  // If this is the first wallet, make it default
  const walletCount = await prisma.wallet.count({
    where: { userId: user.id },
  });

  const wallet = await prisma.wallet.create({
    data: {
      name: body.name || `${body.network} Wallet`,
      address,
      network: body.network,
      provider: body.provider,
      walletType: body.walletType || 'hot',
      purpose: body.purpose || 'operations',
      isWatching: body.isWatching || false,
      ens: body.ens,
      notes: body.notes,
      tags: body.tags || [],
      isDefault: walletCount === 0,
      nativeSymbol: getNetworkNativeSymbol(body.network),
      userId: user.id,
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(wallet, { status: 201 });
}

function getNetworkNativeSymbol(network: string): string {
  const symbols: Record<string, string> = {
    ethereum: 'ETH',
    polygon: 'MATIC',
    arbitrum: 'ETH',
    optimism: 'ETH',
    base: 'ETH',
    solana: 'SOL',
    bitcoin: 'BTC',
    avalanche: 'AVAX',
    bsc: 'BNB',
  };
  return symbols[network] || 'ETH';
}