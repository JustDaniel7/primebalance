// =============================================================================
// LIABILITIES API - Archive (TS Section 18)
// src/app/api/liabilities/[id]/archive/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    LiabilityStatus,
    LiabilityEventType,
    canTransitionTo,
} from '@/types/liabilities';

// =============================================================================
// POST - Archive Liability
// =============================================================================

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { reason, notes } = body;

        // Find liability
        const liability = await (prisma as any).liability.findFirst({
            where: {
                organizationId: session.user.organizationId,
                OR: [
                    { id },
                    { liabilityId: id },
                ],
            },
        });

        if (!liability) {
            return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
        }

        // Validate state transition
        if (!canTransitionTo(liability.status, LiabilityStatus.ARCHIVED)) {
            return NextResponse.json(
                {
                    error: `Cannot archive liability from status '${liability.status}'. Must be fully settled or written off first.`,
                    code: 'INVALID_STATE_TRANSITION',
                    currentStatus: liability.status,
                },
                { status: 400 }
            );
        }

        const now = new Date();

        // Update liability
        const updated = await (prisma as any).liability.update({
            where: { id: liability.id },
            data: {
                status: LiabilityStatus.ARCHIVED,
                previousStatus: liability.status,
                statusChangedAt: now,
                statusChangedBy: session.user.id,
                archivedAt: now,
                archivedBy: session.user.id,
                archiveReason: reason || 'Manual archive',
                version: liability.version + 1,
                eventCount: liability.eventCount + 1,
            },
        });

        // Create event
        const eventId = `evt_${liability.liabilityId}_archived_${now.getTime()}`;

        await (prisma as any).liabilityEvent.create({
            data: {
                eventId,
                liabilityId: liability.id,
                eventType: LiabilityEventType.LIABILITY_ARCHIVED,
                timestamp: now,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    status: LiabilityStatus.ARCHIVED,
                    reason: reason || 'Manual archive',
                    notes,
                    finalState: {
                        originalPrincipal: Number(liability.originalPrincipal),
                        totalSettled: Number(liability.totalSettled),
                        totalOutstanding: Number(liability.totalOutstanding),
                    },
                },
                previousState: {
                    status: liability.status,
                },
                previousEventId: liability.lastEventId,
                explanation: `Liability ${liability.liabilityId} archived. ${reason || ''}`,
            },
        });

        // Update last event ID
        await (prisma as any).liability.update({
            where: { id: liability.id },
            data: { lastEventId: eventId },
        });

        return NextResponse.json({
            liability: {
                ...updated,
                originalPrincipal: Number(updated.originalPrincipal),
                totalOutstanding: Number(updated.totalOutstanding),
                totalSettled: Number(updated.totalSettled),
            },
            message: `Liability ${liability.liabilityId} archived successfully`,
            eventId,
        });
    } catch (error) {
        console.error('Error archiving liability:', error);
        return NextResponse.json(
            { error: 'Failed to archive liability' },
            { status: 500 }
        );
    }
}