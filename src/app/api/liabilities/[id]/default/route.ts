// =============================================================================
// LIABILITIES API - Default Management (TS Sections 5, 10)
// src/app/api/liabilities/[id]/default/route.ts
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
// POST - Mark as Default
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
        const { reason, defaultDate } = body;

        // Validate reason
        if (!reason?.trim()) {
            return NextResponse.json(
                { error: 'Default reason is required' },
                { status: 400 }
            );
        }

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
        if (!canTransitionTo(liability.status, LiabilityStatus.IN_DEFAULT)) {
            return NextResponse.json(
                {
                    error: `Cannot mark liability as default from status '${liability.status}'`,
                    code: 'INVALID_STATE_TRANSITION',
                    currentStatus: liability.status,
                },
                { status: 400 }
            );
        }

        const now = new Date();
        const defDate = defaultDate ? new Date(defaultDate) : now;

        // Calculate days overdue
        let daysOverdue = 0;
        if (liability.nextPaymentDate) {
            const paymentDate = new Date(liability.nextPaymentDate);
            daysOverdue = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Update liability
        const updated = await (prisma as any).liability.update({
            where: { id: liability.id },
            data: {
                status: LiabilityStatus.IN_DEFAULT,
                previousStatus: liability.status,
                statusChangedAt: now,
                statusChangedBy: session.user.id,
                isInDefault: true,
                defaultDate: defDate,
                defaultReason: reason,
                daysOverdue: Math.max(daysOverdue, 0),
                riskLevel: 'critical',
                systemTags: [...(liability.systemTags || []), 'in_default'],
                version: liability.version + 1,
                eventCount: liability.eventCount + 1,
            },
        });

        // Create event
        const eventId = `evt_${liability.liabilityId}_defaulted_${now.getTime()}`;

        await (prisma as any).liabilityEvent.create({
            data: {
                eventId,
                liabilityId: liability.id,
                eventType: LiabilityEventType.LIABILITY_DEFAULTED,
                timestamp: now,
                effectiveDate: defDate,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    status: LiabilityStatus.IN_DEFAULT,
                    reason,
                    defaultDate: defDate.toISOString(),
                    daysOverdue,
                    outstandingAmount: Number(liability.totalOutstanding),
                },
                previousState: {
                    status: liability.status,
                    isInDefault: false,
                    riskLevel: liability.riskLevel,
                },
                previousEventId: liability.lastEventId,
                explanation: `Liability ${liability.liabilityId} marked as default. Reason: ${reason}. Outstanding: ${liability.currency} ${Number(liability.totalOutstanding).toLocaleString()}`,
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
            message: `Liability ${liability.liabilityId} marked as default`,
            eventId,
        });
    } catch (error) {
        console.error('Error marking liability as default:', error);
        return NextResponse.json(
            { error: 'Failed to mark liability as default' },
            { status: 500 }
        );
    }
}