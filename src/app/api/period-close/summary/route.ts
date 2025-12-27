// src/app/api/period-close/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils';

// GET /api/period-close/summary - Dashboard summary
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const orgId = user.organizationId;

  // Get all periods
  const periods = await prisma.accountingPeriod.findMany({
    where: { organizationId: orgId },
    include: {
      checklistItems: true,
      missingItems: { where: { status: { in: ['open', 'in_progress'] } } },
      adjustments: { where: { status: { in: ['draft', 'pending_approval'] } } },
    },
    orderBy: { endDate: 'desc' },
  });

  // Find current period (open, closing, or reopened)
  const currentPeriod = periods.find((p) =>
    ['open', 'closing', 'reopened'].includes(p.status)
  ) || null;

  // Count by status
  const openPeriods = periods.filter((p) => p.status === 'open' || p.status === 'reopened').length;
  const closedPeriods = periods.filter((p) => p.status === 'closed').length;
  const lockedPeriods = periods.filter((p) => p.status === 'locked').length;

  // Current period metrics
  let checklistProgress = 0;
  let pendingItems = 0;
  let criticalBlockers = 0;
  let pendingAdjustments = 0;
  let totalAdjustmentAmount = 0;
  let openMissingItems = 0;
  let criticalMissingItems = 0;

  if (currentPeriod) {
    checklistProgress = Number(currentPeriod.checklistProgress) || 0;
    pendingItems = currentPeriod.checklistItems.filter(
      (i) => i.status === 'pending' || i.status === 'in_progress'
    ).length;
    criticalBlockers = currentPeriod.checklistItems.filter(
      (i) => i.isCritical && i.status !== 'completed' && i.status !== 'skipped'
    ).length;
    pendingAdjustments = currentPeriod.adjustments.length;
    totalAdjustmentAmount = currentPeriod.adjustments.reduce(
      (sum, a) => sum + Number(a.amount), 0
    );
    openMissingItems = currentPeriod.missingItems.length;
    criticalMissingItems = currentPeriod.missingItems.filter(
      (i) => i.severity === 'critical'
    ).length;
  }

  // Calculate average close time
  const closedPeriodsWithDates = periods.filter((p) => p.status === 'closed' && p.closedAt);
  let averageCloseTime = 0;
  if (closedPeriodsWithDates.length > 0) {
    const totalDays = closedPeriodsWithDates.reduce((sum, p) => {
      const endDate = new Date(p.endDate);
      const closedAt = new Date(p.closedAt!);
      return sum + Math.ceil((closedAt.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    averageCloseTime = Math.round(totalDays / closedPeriodsWithDates.length);
  }

  // Last close date
  const lastClosed = periods.find((p) => p.status === 'closed' || p.status === 'locked');
  const lastCloseDate = lastClosed?.closedAt?.toISOString();

  // Next close deadline (end of current period)
  const nextCloseDeadline = currentPeriod?.endDate
    ? new Date(currentPeriod.endDate).toISOString()
    : undefined;

  const summary = {
    currentPeriod: currentPeriod ? {
      id: currentPeriod.id,
      name: currentPeriod.name,
      code: currentPeriod.code,
      status: currentPeriod.status,
      endDate: currentPeriod.endDate.toISOString(),
      checklistProgress,
    } : null,
    openPeriods,
    closedPeriods,
    lockedPeriods,
    checklistProgress,
    pendingItems,
    criticalBlockers,
    pendingAdjustments,
    totalAdjustmentAmount,
    openMissingItems,
    criticalMissingItems,
    averageCloseTime,
    lastCloseDate,
    nextCloseDeadline,
  };

  return NextResponse.json(summary);
}