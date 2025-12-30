// =============================================================================
// LIABILITIES API - Activate Liability (TS Section 5)
// src/app/api/liabilities/[id]/activate/route.ts
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
// POST - Activate Liability
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
        const { activationDate, notes } = body;

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
        if (!canTransitionTo(liability.status, LiabilityStatus.ACTIVE)) {
            return NextResponse.json(
                {
                    error: `Cannot activate liability from status '${liability.status}'`,
                    code: 'INVALID_STATE_TRANSITION',
                    currentStatus: liability.status,
                    targetStatus: LiabilityStatus.ACTIVE,
                },
                { status: 400 }
            );
        }

        const now = new Date();
        const actDate = activationDate ? new Date(activationDate) : now;

        // Calculate next payment date if payment schedule exists
        let nextPaymentDate = null;
        if (liability.paymentSchedule && Array.isArray(liability.paymentSchedule)) {
            const futurePayments = liability.paymentSchedule.filter(
                (p: any) => new Date(p.dueDate) > now && p.status !== 'completed'
            );
            if (futurePayments.length > 0) {
                nextPaymentDate = new Date(futurePayments[0].dueDate);
            }
        }

        // Calculate next cash outflow
        const nextCashOutflow = nextPaymentDate || liability.maturityDate;

        // Update liability
        const updated = await (prisma as any).liability.update({
            where: { id: liability.id },
            data: {
                status: LiabilityStatus.ACTIVE,
                previousStatus: liability.status,
                statusChangedAt: now,
                statusChangedBy: session.user.id,
                activationDate: actDate,
                nextPaymentDate,
                nextCashOutflow,
                version: liability.version + 1,
                eventCount: liability.eventCount + 1,
            },
        });

        // Create event
        const eventId = `evt_${liability.liabilityId}_activated_${now.getTime()}`;

        await (prisma as any).liabilityEvent.create({
            data: {
                eventId,
                liabilityId: liability.id,
                eventType: LiabilityEventType.LIABILITY_ACTIVATED,
                timestamp: now,
                effectiveDate: actDate,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    status: LiabilityStatus.ACTIVE,
                    activationDate: actDate.toISOString(),
                    nextPaymentDate: nextPaymentDate?.toISOString(),
                    notes,
                },
                previousState: {
                    status: liability.status,
                },
                previousEventId: liability.lastEventId,
                explanation: `Liability ${liability.liabilityId} activated on ${actDate.toISOString().split('T')[0]}`,
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
            message: `Liability ${liability.liabilityId} activated successfully`,
            eventId,
        });
    } catch (error) {
        console.error('Error activating liability:', error);
        return NextResponse.json(
            { error: 'Failed to activate liability' },
            { status: 500 }
        );
    }
}