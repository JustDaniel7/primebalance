// =============================================================================
// DUNNING API - Statistics (TS Section 15)
// src/app/api/dunning/statistics/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DunningStatus, DunningLevel } from '@/types/dunning';

// =============================================================================
// GET - Comprehensive Statistics (TS Section 15.1)
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orgId = session.user.organizationId;
        const now = new Date();

        // Run all statistics queries in parallel
        const [
            // Total aggregates
            totals,
            // By status
            byStatus,
            // By level
            byLevel,
            // By currency
            byCurrency,
            // By jurisdiction
            byJurisdiction,
            // By customer type
            byCustomerType,
            // Aging buckets
            aging1to30,
            aging31to60,
            aging61to90,
            aging90plus,
            // Active states
            pendingProposals,
            activeDisputes,
            // Settlement stats
            settledThisMonth,
            writtenOffThisMonth,
            // Communication stats
            communicationsSent,
            // Recovery rate data
            totalOriginal,
            totalSettled,
        ] = await Promise.all([
            // Totals
            (prisma as any).dunning.aggregate({
                where: { organizationId: orgId },
                _sum: {
                    outstandingAmount: true,
                    interestAccrued: true,
                    feesAccrued: true,
                    totalDue: true,
                    originalAmount: true,
                },
                _count: { id: true },
                _avg: { daysPastDue: true },
            }),

            // By status
            (prisma as any).dunning.groupBy({
                by: ['status'],
                where: { organizationId: orgId },
                _count: { id: true },
                _sum: { outstandingAmount: true, totalDue: true },
            }),

            // By level
            (prisma as any).dunning.groupBy({
                by: ['currentLevel'],
                where: { organizationId: orgId },
                _count: { id: true },
                _sum: { outstandingAmount: true },
            }),

            // By currency
            (prisma as any).dunning.groupBy({
                by: ['currency'],
                where: { organizationId: orgId },
                _count: { id: true },
                _sum: { outstandingAmount: true, totalDue: true },
            }),

            // By jurisdiction
            (prisma as any).dunning.groupBy({
                by: ['jurisdictionId'],
                where: { organizationId: orgId, jurisdictionId: { not: null } },
                _count: { id: true },
                _sum: { outstandingAmount: true },
            }),

            // By customer type
            (prisma as any).dunning.groupBy({
                by: ['customerType'],
                where: { organizationId: orgId, customerType: { not: null } },
                _count: { id: true },
                _sum: { outstandingAmount: true },
            }),

            // Aging 1-30 days
            (prisma as any).dunning.aggregate({
                where: {
                    organizationId: orgId,
                    daysPastDue: { gte: 1, lte: 30 },
                    status: { notIn: [DunningStatus.SETTLED, DunningStatus.WRITTEN_OFF] },
                },
                _count: { id: true },
                _sum: { outstandingAmount: true },
            }),

            // Aging 31-60 days
            (prisma as any).dunning.aggregate({
                where: {
                    organizationId: orgId,
                    daysPastDue: { gte: 31, lte: 60 },
                    status: { notIn: [DunningStatus.SETTLED, DunningStatus.WRITTEN_OFF] },
                },
                _count: { id: true },
                _sum: { outstandingAmount: true },
            }),

            // Aging 61-90 days
            (prisma as any).dunning.aggregate({
                where: {
                    organizationId: orgId,
                    daysPastDue: { gte: 61, lte: 90 },
                    status: { notIn: [DunningStatus.SETTLED, DunningStatus.WRITTEN_OFF] },
                },
                _count: { id: true },
                _sum: { outstandingAmount: true },
            }),

            // Aging 90+ days
            (prisma as any).dunning.aggregate({
                where: {
                    organizationId: orgId,
                    daysPastDue: { gt: 90 },
                    status: { notIn: [DunningStatus.SETTLED, DunningStatus.WRITTEN_OFF] },
                },
                _count: { id: true },
                _sum: { outstandingAmount: true },
            }),

            // Pending proposals
            (prisma as any).dunningProposal.count({
                where: { organizationId: orgId, status: 'pending' },
            }),

            // Active disputes
            (prisma as any).dunning.count({
                where: { organizationId: orgId, isDisputed: true },
            }),

            // Settled this month
            (prisma as any).dunning.aggregate({
                where: {
                    organizationId: orgId,
                    status: DunningStatus.SETTLED,
                    settledAt: {
                        gte: new Date(now.getFullYear(), now.getMonth(), 1),
                    },
                },
                _count: { id: true },
                _sum: { settledAmount: true },
            }),

            // Written off this month
            (prisma as any).dunning.aggregate({
                where: {
                    organizationId: orgId,
                    status: DunningStatus.WRITTEN_OFF,
                    writtenOffAt: {
                        gte: new Date(now.getFullYear(), now.getMonth(), 1),
                    },
                },
                _count: { id: true },
                _sum: { writtenOffAmount: true },
            }),

            // Communications sent this month
            (prisma as any).dunningCommunication.count({
                where: {
                    organizationId: orgId,
                    status: 'sent',
                    sentAt: {
                        gte: new Date(now.getFullYear(), now.getMonth(), 1),
                    },
                },
            }),

            // For recovery rate: total original amount
            (prisma as any).dunning.aggregate({
                where: { organizationId: orgId },
                _sum: { originalAmount: true },
            }),

            // For recovery rate: total settled
            (prisma as any).dunning.aggregate({
                where: { organizationId: orgId, status: DunningStatus.SETTLED },
                _sum: { settledAmount: true },
            }),
        ]);

        // Calculate DSO (Days Sales Outstanding)
        const avgDaysPastDue = totals._avg.daysPastDue || 0;

        // Calculate recovery rate
        const totalOriginalAmount = Number(totalOriginal._sum.originalAmount || 0);
        const totalSettledAmount = Number(totalSettled._sum.settledAmount || 0);
        const recoveryRate = totalOriginalAmount > 0
            ? (totalSettledAmount / totalOriginalAmount) * 100
            : 0;

        // Calculate dispute rate
        const totalActive = totals._count.id -
            (byStatus.find((s: any) => s.status === DunningStatus.SETTLED)?._count.id || 0) -
            (byStatus.find((s: any) => s.status === DunningStatus.WRITTEN_OFF)?._count.id || 0);
        const disputeRate = totalActive > 0 ? (activeDisputes / totalActive) * 100 : 0;

        // Success rate per level
        const successByLevel: Record<number, { sent: number; settled: number; rate: number }> = {};
        for (const level of [DunningLevel.REMINDER, DunningLevel.LEVEL_1, DunningLevel.LEVEL_2, DunningLevel.LEVEL_3]) {
            const sent = await (prisma as any).dunning.count({
                where: {
                    organizationId: orgId,
                    currentLevel: { gte: level },
                },
            });
            const settled = await (prisma as any).dunning.count({
                where: {
                    organizationId: orgId,
                    status: DunningStatus.SETTLED,
                    currentLevel: level,
                },
            });
            successByLevel[level] = {
                sent,
                settled,
                rate: sent > 0 ? (settled / sent) * 100 : 0,
            };
        }

        return NextResponse.json({
            summary: {
                totalCount: totals._count.id,
                totalOutstanding: Number(totals._sum.outstandingAmount || 0),
                totalInterest: Number(totals._sum.interestAccrued || 0),
                totalFees: Number(totals._sum.feesAccrued || 0),
                totalDue: Number(totals._sum.totalDue || 0),
                totalOriginal: Number(totals._sum.originalAmount || 0),
            },

            byStatus: byStatus.reduce((acc: any, item: any) => {
                acc[item.status] = {
                    count: item._count.id,
                    outstanding: Number(item._sum.outstandingAmount || 0),
                    totalDue: Number(item._sum.totalDue || 0),
                };
                return acc;
            }, {}),

            byLevel: byLevel.reduce((acc: any, item: any) => {
                acc[item.currentLevel] = {
                    count: item._count.id,
                    outstanding: Number(item._sum.outstandingAmount || 0),
                };
                return acc;
            }, {}),

            byCurrency: byCurrency.reduce((acc: any, item: any) => {
                acc[item.currency] = {
                    count: item._count.id,
                    outstanding: Number(item._sum.outstandingAmount || 0),
                    totalDue: Number(item._sum.totalDue || 0),
                };
                return acc;
            }, {}),

            byJurisdiction: byJurisdiction.reduce((acc: any, item: any) => {
                if (item.jurisdictionId) {
                    acc[item.jurisdictionId] = {
                        count: item._count.id,
                        outstanding: Number(item._sum.outstandingAmount || 0),
                    };
                }
                return acc;
            }, {}),

            byCustomerType: byCustomerType.reduce((acc: any, item: any) => {
                if (item.customerType) {
                    acc[item.customerType] = {
                        count: item._count.id,
                        outstanding: Number(item._sum.outstandingAmount || 0),
                    };
                }
                return acc;
            }, {}),

            overdueAging: {
                days1to30: {
                    count: aging1to30._count.id,
                    amount: Number(aging1to30._sum.outstandingAmount || 0),
                },
                days31to60: {
                    count: aging31to60._count.id,
                    amount: Number(aging31to60._sum.outstandingAmount || 0),
                },
                days61to90: {
                    count: aging61to90._count.id,
                    amount: Number(aging61to90._sum.outstandingAmount || 0),
                },
                days90plus: {
                    count: aging90plus._count.id,
                    amount: Number(aging90plus._sum.outstandingAmount || 0),
                },
            },

            keyMetrics: {
                dso: Math.round(avgDaysPastDue * 10) / 10,
                recoveryRate: Math.round(recoveryRate * 100) / 100,
                disputeRate: Math.round(disputeRate * 100) / 100,
                successByLevel,
            },

            activity: {
                pendingProposals,
                activeDisputes,
                settledThisMonth: {
                    count: settledThisMonth._count.id,
                    amount: Number(settledThisMonth._sum.settledAmount || 0),
                },
                writtenOffThisMonth: {
                    count: writtenOffThisMonth._count.id,
                    amount: Number(writtenOffThisMonth._sum.writtenOffAmount || 0),
                },
                communicationsSentThisMonth: communicationsSent,
            },

            generatedAt: now.toISOString(),
        });
    } catch (error) {
        console.error('Error fetching dunning statistics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dunning statistics' },
            { status: 500 }
        );
    }
}