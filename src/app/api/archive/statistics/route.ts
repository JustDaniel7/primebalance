// =============================================================================
// ARCHIVE API - Statistics & Reporting (TS Section 13)
// src/app/api/archive/statistics/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// GET - Get Archive Statistics
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orgId = session.user.organizationId;
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const next30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const next90d = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

        // Get all aggregations in parallel
        const [
            totalRecords,
            byObjectType,
            byCategory,
            byStatus,
            byRetentionStatus,
            byFiscalYear,
            byCurrency,
            archivedLast24h,
            archivedLast7d,
            archivedLast30d,
            accessedLast24h,
            exportedLast24h,
            expiringIn30d,
            expiringIn90d,
            expired,
            onLegalHold,
            totalAmount,
        ] = await Promise.all([
            (prisma as any).archiveRecord.count({ where: { organizationId: orgId } }),
            (prisma as any).archiveRecord.groupBy({
                by: ['objectType'],
                where: { organizationId: orgId },
                _count: { id: true },
                _sum: { amount: true },
            }),
            (prisma as any).archiveRecord.groupBy({
                by: ['category'],
                where: { organizationId: orgId },
                _count: { id: true },
            }),
            (prisma as any).archiveRecord.groupBy({
                by: ['status'],
                where: { organizationId: orgId },
                _count: { id: true },
            }),
            (prisma as any).archiveRecord.groupBy({
                by: ['retentionStatus'],
                where: { organizationId: orgId },
                _count: { id: true },
            }),
            (prisma as any).archiveRecord.groupBy({
                by: ['fiscalYear'],
                where: { organizationId: orgId, fiscalYear: { not: null } },
                _count: { id: true },
                _sum: { amount: true },
            }),
            (prisma as any).archiveRecord.groupBy({
                by: ['currency'],
                where: { organizationId: orgId },
                _count: { id: true },
                _sum: { amount: true },
            }),
            (prisma as any).archiveRecord.count({
                where: { organizationId: orgId, archivedAt: { gte: last24h } },
            }),
            (prisma as any).archiveRecord.count({
                where: { organizationId: orgId, archivedAt: { gte: last7d } },
            }),
            (prisma as any).archiveRecord.count({
                where: { organizationId: orgId, archivedAt: { gte: last30d } },
            }),
            (prisma as any).archiveRecord.count({
                where: { organizationId: orgId, lastAccessedAt: { gte: last24h } },
            }),
            (prisma as any).archiveRecord.count({
                where: { organizationId: orgId, lastExportedAt: { gte: last24h } },
            }),
            (prisma as any).archiveRecord.count({
                where: {
                    organizationId: orgId,
                    retentionEndDate: { lte: next30d, gt: now },
                    legalHold: false,
                },
            }),
            (prisma as any).archiveRecord.count({
                where: {
                    organizationId: orgId,
                    retentionEndDate: { lte: next90d, gt: now },
                    legalHold: false,
                },
            }),
            (prisma as any).archiveRecord.count({
                where: {
                    organizationId: orgId,
                    retentionEndDate: { lt: now },
                    legalHold: false,
                },
            }),
            (prisma as any).archiveRecord.count({
                where: { organizationId: orgId, legalHold: true },
            }),
            (prisma as any).archiveRecord.aggregate({
                where: { organizationId: orgId },
                _sum: { contentSize: true },
            }),
        ]);

        // Transform results
        const statistics = {
            totalRecords,
            totalSize: totalAmount._sum.contentSize || 0,

            byObjectType: byObjectType.reduce((acc: any, item: any) => {
                acc[item.objectType] = {
                    count: item._count.id,
                    totalAmount: item._sum.amount ? Number(item._sum.amount) : 0,
                };
                return acc;
            }, {}),

            byCategory: byCategory.reduce((acc: any, item: any) => {
                acc[item.category] = item._count.id;
                return acc;
            }, {}),

            byStatus: byStatus.reduce((acc: any, item: any) => {
                acc[item.status] = item._count.id;
                return acc;
            }, {}),

            byRetentionStatus: byRetentionStatus.reduce((acc: any, item: any) => {
                acc[item.retentionStatus] = item._count.id;
                return acc;
            }, {}),

            byFiscalYear: byFiscalYear.reduce((acc: any, item: any) => {
                if (item.fiscalYear) {
                    acc[item.fiscalYear] = {
                        count: item._count.id,
                        totalAmount: item._sum.amount ? Number(item._sum.amount) : 0,
                    };
                }
                return acc;
            }, {}),

            byCurrency: byCurrency.reduce((acc: any, item: any) => {
                acc[item.currency] = {
                    count: item._count.id,
                    totalAmount: item._sum.amount ? Number(item._sum.amount) : 0,
                };
                return acc;
            }, {}),

            recentActivity: {
                archivedLast24h,
                archivedLast7d,
                archivedLast30d,
                accessedLast24h,
                exportedLast24h,
            },

            retentionSummary: {
                expiringIn30d,
                expiringIn90d,
                expired,
                onLegalHold,
            },
        };

        return NextResponse.json({ statistics });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}