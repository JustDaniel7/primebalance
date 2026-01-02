// =============================================================================
// DUNNING API - Exception Queue (TS Section 9.5)
// src/app/api/dunning/exceptions/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DunningExceptionStatus, DunningExceptionType } from '@/types/dunning';

// =============================================================================
// GET - List Exceptions (TS Section 9.5)
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const skip = (page - 1) * limit;

        // Filters
        const status = searchParams.get('status');
        const exceptionType = searchParams.get('exceptionType');
        const assignedTo = searchParams.get('assignedTo');
        const isOverdue = searchParams.get('isOverdue');
        const dunningId = searchParams.get('dunningId');

        // Build where clause
        const where: any = {
            organizationId: session.user.organizationId,
        };

        if (status) where.status = status;
        if (exceptionType) where.exceptionType = exceptionType;
        if (assignedTo) where.assignedTo = assignedTo;
        if (isOverdue === 'true') where.isOverdue = true;
        if (dunningId) where.dunningId = dunningId;

        // Execute queries
        const [exceptions, total] = await Promise.all([
            (prisma as any).dunningException.findMany({
                where,
                include: {
                    dunning: {
                        select: {
                            dunningId: true,
                            dunningNumber: true,
                            invoiceId: true,
                            customerName: true,
                            outstandingAmount: true,
                            currency: true,
                            status: true,
                        },
                    },
                },
                orderBy: [
                    { isOverdue: 'desc' },
                    { slaDeadline: 'asc' },
                    { createdAt: 'desc' },
                ],
                take: limit,
                skip,
            }),
            (prisma as any).dunningException.count({ where }),
        ]);

        // Get statistics
        const [byStatus, byType, overdueCount] = await Promise.all([
            (prisma as any).dunningException.groupBy({
                by: ['status'],
                where: { organizationId: session.user.organizationId },
                _count: { id: true },
            }),
            (prisma as any).dunningException.groupBy({
                by: ['exceptionType'],
                where: {
                    organizationId: session.user.organizationId,
                    status: { in: [DunningExceptionStatus.OPEN, DunningExceptionStatus.IN_PROGRESS] },
                },
                _count: { id: true },
            }),
            (prisma as any).dunningException.count({
                where: {
                    organizationId: session.user.organizationId,
                    isOverdue: true,
                    status: { in: [DunningExceptionStatus.OPEN, DunningExceptionStatus.IN_PROGRESS] },
                },
            }),
        ]);

        // Format exceptions
        const formattedExceptions = exceptions.map((e: any) => ({
            ...e,
            confidenceScore: e.confidenceScore ? Number(e.confidenceScore) : null,
            dunning: e.dunning ? {
                ...e.dunning,
                outstandingAmount: Number(e.dunning.outstandingAmount),
            } : null,
        }));

        return NextResponse.json({
            exceptions: formattedExceptions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrevious: page > 1,
            },
            statistics: {
                total,
                open: byStatus.find((s: any) => s.status === DunningExceptionStatus.OPEN)?._count.id || 0,
                inProgress: byStatus.find((s: any) => s.status === DunningExceptionStatus.IN_PROGRESS)?._count.id || 0,
                resolved: byStatus.find((s: any) => s.status === DunningExceptionStatus.RESOLVED)?._count.id || 0,
                escalated: byStatus.find((s: any) => s.status === DunningExceptionStatus.ESCALATED)?._count.id || 0,
                overdue: overdueCount,
                byType: byType.reduce((acc: any, item: any) => {
                    acc[item.exceptionType] = item._count.id;
                    return acc;
                }, {}),
            },
        });
    } catch (error) {
        console.error('Error fetching exceptions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch exceptions' },
            { status: 500 }
        );
    }
}