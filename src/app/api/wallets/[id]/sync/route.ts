// src/app/api/wallets/[id]/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

// POST /api/wallets/[id]/sync - Sync wallet balances
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const wallet = await prisma.wallet.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
  }

  // Update sync status
  await prisma.wallet.update({
    where: { id },
    data: { lastSyncStatus: 'pending' },
  });

  try {
    // In production, call blockchain APIs (Alchemy, Moralis, etc.)
    // For now, simulate with mock data
    const mockNativeBalance = Math.random() * 10;
    const mockTokens = generateMockTokens(wallet.network);
    const totalValueUsd = mockNativeBalance * getNativePrice(wallet.network) +
      mockTokens.reduce((sum, t) => sum + t.balanceUsd, 0);

    // Update wallet balance
    await prisma.wallet.update({
      where: { id },
      data: {
        nativeBalance: mockNativeBalance,
        totalValueUsd,
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
      },
    });

    // Upsert tokens
    for (const token of mockTokens) {
      await prisma.walletToken.upsert({
        where: {
          walletId_contractAddress: {
            walletId: id,
            contractAddress: token.contractAddress,
          },
        },
        create: {
          walletId: id,
          ...token,
        },
        update: {
          balance: token.balance,
          balanceUsd: token.balanceUsd,
          priceUsd: token.priceUsd,
          lastPriceAt: new Date(),
        },
      });
    }

    const updated = await prisma.wallet.findUnique({
      where: { id },
      include: { tokens: { where: { isHidden: false } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    await prisma.wallet.update({
      where: { id },
      data: { lastSyncStatus: 'failed' },
    });

    return NextResponse.json(
      { error: 'Sync failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

function getNativePrice(network: string): number {
  // Mock prices - in production, fetch from price API
  const prices: Record<string, number> = {
    ethereum: 3500,
    polygon: 0.85,
    arbitrum: 3500,
    optimism: 3500,
    base: 3500,
    solana: 180,
    bitcoin: 95000,
    avalanche: 35,
    bsc: 600,
  };
  return prices[network] || 0;
}

function generateMockTokens(network: string) {
  if (network === 'ethereum' || network === 'polygon' || network === 'arbitrum') {
    return [
      {
        contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        balance: Math.random() * 10000,
        balanceUsd: Math.random() * 10000,
        priceUsd: 1.0,
        tokenType: 'erc20',
      },
      {
        contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        balance: Math.random() * 5000,
        balanceUsd: Math.random() * 5000,
        priceUsd: 1.0,
        tokenType: 'erc20',
      },
    ];
  }
  return [];
}