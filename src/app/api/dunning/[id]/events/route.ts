// =============================================================================
// DUNNING API - Event History (TS Section 4)
// src/app/api/dunning/[id]/events/route.ts
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
        const actorId = searchParams.get('actorId');

        // Find dunning
        const dunning = await (prisma as any).dunning.findFirst({
            where: {
                organizationId: session.user.organizationId,
                OR: [
                    { id },
                    { dunningId: id },
                    { dunningNumber: id },
                ],
            },
            select: { id: true, dunningId: true, dunningNumber: true },
        });

        if (!dunning) {
            return NextResponse.json({ error: 'Dunning record not found' }, { status: 404 });
        }

        // Build where clause
        const where: any = { dunningId: dunning.id };

        if (eventType) where.eventType = eventType;
        if (actorId) where.actorId = actorId;
        if (fromDate || toDate) {
            where.timestamp = {};
            if (fromDate) where.timestamp.gte = new Date(fromDate);
            if (toDate) where.timestamp.lte = new Date(toDate);
        }

        // Get events
        const [events, total] = await Promise.all([
            (prisma as any).dunningEvent.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                take: limit,
                skip,
            }),
            (prisma as any).dunningEvent.count({ where }),
        ]);

        // Get event type summary
        const summary = await (prisma as any).dunningEvent.groupBy({
            by: ['eventType'],
            where: { dunningId: dunning.id },
            _count: { id: true },
        });

        return NextResponse.json({
            dunningId: dunning.dunningId,
            dunningNumber: dunning.dunningNumber,
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
                byEventType: summary.reduce((acc: any, item: any) => {
                    acc[item.eventType] = item._count.id;
                    return acc;
                }, {}),
            },
        });
    } catch (error) {
        console.error('Error fetching dunning events:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dunning events' },
            { status: 500 }
        );
    }
}