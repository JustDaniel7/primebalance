// =============================================================================
// LIABILITIES API - Event History (TS Section 4)
// src/app/api/liabilities/[id]/events/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// GET - Get Event History
// =============================================================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const skip = (page - 1) * limit;

        // Filters
        const eventType = searchParams.get('eventType');
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');

        // Find liability
        const liability = await (prisma as any).liability.findFirst({
            where: {
                organizationId: session.user.organizationId,
                OR: [
                    { id },
                    { liabilityId: id },
                ],
            },
            select: { id: true, liabilityId: true },
        });

        if (!liability) {
            return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
        }

        // Build where clause
        const where: any = {
            liabilityId: liability.id,
        };

        if (eventType) where.eventType = eventType;
        if (fromDate || toDate) {
            where.timestamp = {};
            if (fromDate) where.timestamp.gte = new Date(fromDate);
            if (toDate) where.timestamp.lte = new Date(toDate);
        }

        // Get events
        const [events, total] = await Promise.all([
            (prisma as any).liabilityEvent.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                take: limit,
                skip,
            }),
            (prisma as any).liabilityEvent.count({ where }),
        ]);

        // Get event type counts
        const eventTypeCounts = await (prisma as any).liabilityEvent.groupBy({
            by: ['eventType'],
            where: { liabilityId: liability.id },
            _count: { id: true },
        });

        return NextResponse.json({
            liabilityId: liability.liabilityId,
            events,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrevious: page > 1,
            },
            summary: {
                totalEvents: total,
                byEventType: eventTypeCounts.reduce((acc: any, item: any) => {
                    acc[item.eventType] = item._count.id;
                    return acc;
                }, {}),
            },
        });
    } catch (error) {
        console.error('Error fetching liability events:', error);
        return NextResponse.json(
            { error: 'Failed to fetch liability events' },
            { status: 500 }
        );
    }
}