// src/app/api/netting/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const orgId = user.organizationId;

  // Get all sessions
  const sessions = await prisma.nettingSession.findMany({
    where: { organizationId: orgId },
    orderBy: { nettingDate: 'desc' },
  });

  // Calculate analytics
  const settledSessions = sessions.filter((s) => s.status === 'settled');
  const pendingSessions = sessions.filter((s) => ['draft', 'pending_approval', 'approved'].includes(s.status));

  const totalGrossAmount = sessions.reduce((sum, s) => sum + Number(s.grossAmount), 0);
  const totalNetAmount = sessions.reduce((sum, s) => sum + Number(s.netAmount), 0);
  const totalSavings = sessions.reduce((sum, s) => sum + Number(s.savingsAmount), 0);
  const avgSavingsPercentage = sessions.length > 0
    ? sessions.reduce((sum, s) => sum + Number(s.savingsPercentage), 0) / sessions.length
    : 0;

  // By type
  const counterpartySessions = sessions.filter((s) => s.type === 'counterparty');
  const intercompanySessions = sessions.filter((s) => s.type === 'intercompany');
  const multilateralSessions = sessions.filter((s) => s.type === 'multilateral');

  const byType = {
    counterparty: {
      sessions: counterpartySessions.length,
      savings: counterpartySessions.reduce((sum, s) => sum + Number(s.savingsAmount), 0),
    },
    intercompany: {
      sessions: intercompanySessions.length,
      savings: intercompanySessions.reduce((sum, s) => sum + Number(s.savingsAmount), 0),
    },
    multilateral: {
      sessions: multilateralSessions.length,
      savings: multilateralSessions.reduce((sum, s) => sum + Number(s.savingsAmount), 0),
    },
  };

  // Recent sessions
  const recentSessions = sessions.slice(0, 10).map((s) => ({
    id: s.id,
    sessionNumber: s.sessionNumber,
    netAmount: Number(s.netAmount),
    savings: Number(s.savingsAmount),
    status: s.status,
  }));

  // Get netting opportunities
  const opportunities = await prisma.nettingOpportunity.findMany({
    where: { organizationId: orgId, status: { in: ['identified', 'proposed'] } },
  });

  const analytics = {
    totalSessions: sessions.length,
    settledSessions: settledSessions.length,
    pendingSessions: pendingSessions.length,
    totalGrossAmount,
    totalNetAmount,
    totalSavings,
    avgSavingsPercentage,
    byType,
    recentSessions,
    topCounterparties: [], // Would need positions aggregation
    opportunitiesCount: opportunities.length,
    opportunitiesSavings: opportunities.reduce((sum, o) => sum + Number(o.savingsAmount), 0),
  };

  return NextResponse.json(analytics);
}