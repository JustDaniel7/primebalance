// src/app/api/wallets/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils';

// GET /api/wallets/summary - Portfolio summary
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.id) return unauthorized();

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id, isActive: true },
    include: {
      tokens: { where: { isHidden: false, isSpam: false } },
    },
  });

  // Aggregate totals
  let totalValueUsd = 0;
  const byNetwork: Record<string, number> = {};
  const byPurpose: Record<string, number> = {};
  const topTokens: Array<{ symbol: string; balanceUsd: number; network: string }> = [];

  wallets.forEach((wallet) => {
    totalValueUsd += Number(wallet.totalValueUsd);

    // By network
    if (!byNetwork[wallet.network]) byNetwork[wallet.network] = 0;
    byNetwork[wallet.network] += Number(wallet.totalValueUsd);

    // By purpose
    if (!byPurpose[wallet.purpose]) byPurpose[wallet.purpose] = 0;
    byPurpose[wallet.purpose] += Number(wallet.totalValueUsd);

    // Collect tokens
    wallet.tokens.forEach((token) => {
      topTokens.push({
        symbol: token.symbol,
        balanceUsd: Number(token.balanceUsd),
        network: wallet.network,
      });
    });
  });

  // Sort and limit top tokens
  topTokens.sort((a, b) => b.balanceUsd - a.balanceUsd);
  const top10Tokens = topTokens.slice(0, 10);

  // Recent transactions
  const recentTransactions = await prisma.walletTransaction.findMany({
    where: {
      wallet: { userId: user.id },
    },
    orderBy: { timestamp: 'desc' },
    take: 10,
    include: {
      wallet: { select: { name: true, network: true } },
    },
  });

  return NextResponse.json({
    totalWallets: wallets.length,
    totalValueUsd,
    byNetwork,
    byPurpose,
    topTokens: top10Tokens,
    recentTransactions,
  });
}