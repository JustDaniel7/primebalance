// =============================================================================
// LIABILITIES API - Statistics (TS Section 13)
// src/app/api/liabilities/statistics/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// GET - Comprehensive Statistics
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orgId = session.user.organizationId;
        const now = new Date();
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        const in1Year = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

        // Run all queries in parallel
        const [
            totals,
            byPrimaryClass,
            byStatus,
            byCurrency,
            byCounterpartyType,
            byRiskLevel,
            defaultCount,
            disputeCount,
            covenantBreachCount,
            cashflow7Days,
            cashflow30Days,
            cashflow90Days,
            cashflow12Months,
            maturityIn30,
            maturityIn90,
            maturityIn1Year,
            maturityOver1Year,
            noMaturity,
        ] = await Promise.all([
            // Totals
            (prisma as any).liability.aggregate({
                where: { organizationId: orgId },
                _sum: {
                    totalOutstanding: true,
                    originalPrincipal: true,
                    accruedInterest: true,
                    feesPenalties: true,
                    totalSettled: true,
                },
                _count: { id: true },
            }),

            // By primary class
            (prisma as any).liability.groupBy({
                by: ['primaryClass'],
                where: { organizationId: orgId },
                _count: { id: true },
                _sum: { totalOutstanding: true },
            }),

            // By status
            (prisma as any).liability.groupBy({
                by: ['status'],
                where: { organizationId: orgId },
                _count: { id: true },
                _sum: { totalOutstanding: true },
            }),

            // By currency
            (prisma as any).liability.groupBy({
                by: ['currency'],
                where: { organizationId: orgId },
                _count: { id: true },
                _sum: { totalOutstanding: true },
            }),

            // By counterparty type
            (prisma as any).liability.groupBy({
                by: ['counterpartyType'],
                where: { organizationId: orgId },
                _count: { id: true },
                _sum: { totalOutstanding: true },
            }),

            // By risk level
            (prisma as any).liability.groupBy({
                by: ['riskLevel'],
                where: { organizationId: orgId },
                _count: { id: true },
                _sum: { totalOutstanding: true },
            }),

            // Counts
            (prisma as any).liability.count({ where: { organizationId: orgId, isInDefault: true } }),
            (prisma as any).liability.count({ where: { organizationId: orgId, isDisputed: true } }),
            (prisma as any).liability.aggregate({
                where: { organizationId: orgId, covenantBreaches: { gt: 0 } },
                _sum: { covenantBreaches: true },
            }),

            // Cashflow (payments due)
            (prisma as any).liability.aggregate({
                where: { organizationId: orgId, nextPaymentDate: { lte: in7Days, gte: now } },
                _sum: { expectedCashImpact: true },
            }),
            (prisma as any).liability.aggregate({
                where: { organizationId: orgId, nextPaymentDate: { lte: in30Days, gte: now } },
                _sum: { expectedCashImpact: true },
            }),
            (prisma as any).liability.aggregate({
                where: { organizationId: orgId, nextPaymentDate: { lte: in90Days, gte: now } },
                _sum: { expectedCashImpact: true },
            }),
            (prisma as any).liability.aggregate({
                where: { organizationId: orgId, nextPaymentDate: { lte: in1Year, gte: now } },
                _sum: { expectedCashImpact: true },
            }),

            // Maturity profile
            (prisma as any).liability.aggregate({
                where: { organizationId: orgId, maturityDate: { lte: in30Days, gte: now } },
                _count: { id: true },
                _sum: { totalOutstanding: true },
            }),
            (prisma as any).liability.aggregate({
                where: { organizationId: orgId, maturityDate: { lte: in90Days, gt: in30Days } },
                _count: { id: true },
                _sum: { totalOutstanding: true },
            }),
            (prisma as any).liability.aggregate({
                where: { organizationId: orgId, maturityDate: { lte: in1Year, gt: in90Days } },
                _count: { id: true },
                _sum: { totalOutstanding: true },
            }),
            (prisma as any).liability.aggregate({
                where: { organizationId: orgId, maturityDate: { gt: in1Year } },
                _count: { id: true },
                _sum: { totalOutstanding: true },
            }),
            (prisma as any).liability.aggregate({
                where: { organizationId: orgId, maturityDate: null },
                _count: { id: true },
                _sum: { totalOutstanding: true },
            }),
        ]);

        // Format results
        const statistics = {
            summary: {
                totalCount: totals._count.id,
                totalOutstanding: Number(totals._sum.totalOutstanding || 0),
                totalOriginalPrincipal: Number(totals._sum.originalPrincipal || 0),
                totalAccruedInterest: Number(totals._sum.accruedInterest || 0),
                totalFeesPenalties: Number(totals._sum.feesPenalties || 0),
                totalSettled: Number(totals._sum.totalSettled || 0),
            },

            byPrimaryClass: byPrimaryClass.reduce((acc: any, item: any) => {
                acc[item.primaryClass] = {
                    count: item._count.id,
                    outstanding: Number(item._sum.totalOutstanding || 0),
                };
                return acc;
            }, {}),

            byStatus: byStatus.reduce((acc: any, item: any) => {
                acc[item.status] = {
                    count: item._count.id,
                    outstanding: Number(item._sum.totalOutstanding || 0),
                };
                return acc;
            }, {}),

            byCurrency: byCurrency.reduce((acc: any, item: any) => {
                acc[item.currency] = {
                    count: item._count.id,
                    outstanding: Number(item._sum.totalOutstanding || 0),
                };
                return acc;
            }, {}),

            byCounterpartyType: byCounterpartyType.reduce((acc: any, item: any) => {
                if (item.counterpartyType) {
                    acc[item.counterpartyType] = {
                        count: item._count.id,
                        outstanding: Number(item._sum.totalOutstanding || 0),
                    };
                }
                return acc;
            }, {}),

            byRiskLevel: byRiskLevel.reduce((acc: any, item: any) => {
                acc[item.riskLevel] = {
                    count: item._count.id,
                    outstanding: Number(item._sum.totalOutstanding || 0),
                };
                return acc;
            }, {}),

            riskSummary: {
                inDefault: defaultCount,
                inDispute: disputeCount,
                covenantBreaches: covenantBreachCount._sum.covenantBreaches || 0,
            },

            cashflowForecast: {
                next7Days: Number(cashflow7Days._sum.expectedCashImpact || 0),
                next30Days: Number(cashflow30Days._sum.expectedCashImpact || 0),
                next90Days: Number(cashflow90Days._sum.expectedCashImpact || 0),
                next12Months: Number(cashflow12Months._sum.expectedCashImpact || 0),
            },

            maturityProfile: {
                within30Days: {
                    count: maturityIn30._count.id,
                    amount: Number(maturityIn30._sum.totalOutstanding || 0),
                },
                within90Days: {
                    count: maturityIn90._count.id,
                    amount: Number(maturityIn90._sum.totalOutstanding || 0),
                },
                within1Year: {
                    count: maturityIn1Year._count.id,
                    amount: Number(maturityIn1Year._sum.totalOutstanding || 0),
                },
                over1Year: {
                    count: maturityOver1Year._count.id,
                    amount: Number(maturityOver1Year._sum.totalOutstanding || 0),
                },
                noMaturity: {
                    count: noMaturity._count.id,
                    amount: Number(noMaturity._sum.totalOutstanding || 0),
                },
            },
        };

        return NextResponse.json(statistics);
    } catch (error) {
        console.error('Error fetching statistics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}