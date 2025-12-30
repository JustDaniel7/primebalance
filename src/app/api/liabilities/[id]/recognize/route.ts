// =============================================================================
// LIABILITIES API - Recognize Liability (TS Section 5)
// src/app/api/liabilities/[id]/recognize/route.ts
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
// POST - Recognize Liability
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
        const { recognitionDate, effectiveDate, notes } = body;

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
        if (!canTransitionTo(liability.status, LiabilityStatus.RECOGNIZED)) {
            return NextResponse.json(
                {
                    error: `Cannot recognize liability from status '${liability.status}'`,
                    code: 'INVALID_STATE_TRANSITION',
                    currentStatus: liability.status,
                    targetStatus: LiabilityStatus.RECOGNIZED,
                },
                { status: 400 }
            );
        }

        const now = new Date();
        const recDate = recognitionDate ? new Date(recognitionDate) : now;
        const effDate = effectiveDate ? new Date(effectiveDate) : recDate;

        // Update liability
        const updated = await (prisma as any).liability.update({
            where: { id: liability.id },
            data: {
                status: LiabilityStatus.RECOGNIZED,
                previousStatus: liability.status,
                statusChangedAt: now,
                statusChangedBy: session.user.id,
                recognitionDate: recDate,
                version: liability.version + 1,
                eventCount: liability.eventCount + 1,
            },
        });

        // Create event
        const eventId = `evt_${liability.liabilityId}_recognized_${now.getTime()}`;

        await (prisma as any).liabilityEvent.create({
            data: {
                eventId,
                liabilityId: liability.id,
                eventType: LiabilityEventType.LIABILITY_RECOGNIZED,
                timestamp: now,
                effectiveDate: effDate,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    status: LiabilityStatus.RECOGNIZED,
                    recognitionDate: recDate.toISOString(),
                    notes,
                },
                previousState: {
                    status: liability.status,
                },
                previousEventId: liability.lastEventId,
                explanation: `Liability ${liability.liabilityId} recognized on ${recDate.toISOString().split('T')[0]}`,
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
                outstandingPrincipal: Number(updated.outstandingPrincipal),
                totalOutstanding: Number(updated.totalOutstanding),
            },
            message: `Liability ${liability.liabilityId} recognized successfully`,
            eventId,
        });
    } catch (error) {
        console.error('Error recognizing liability:', error);
        return NextResponse.json(
            { error: 'Failed to recognize liability' },
            { status: 500 }
        );
    }
}