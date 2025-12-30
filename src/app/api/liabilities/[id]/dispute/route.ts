// =============================================================================
// LIABILITIES API - Dispute Management (TS Section 5)
// src/app/api/liabilities/[id]/dispute/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    LiabilityStatus,
    LiabilityEventType,
    isLiabilityDisputable,
    canTransitionTo,
} from '@/types/liabilities';

// =============================================================================
// POST - Open Dispute
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
        const { reason, disputeAmount, effectiveDate, notes } = body;

        // Validate reason
        if (!reason?.trim()) {
            return NextResponse.json(
                { error: 'Dispute reason is required' },
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

        // Check if already disputed
        if (liability.isDisputed) {
            return NextResponse.json(
                {
                    error: 'Liability is already in dispute',
                    code: 'ALREADY_DISPUTED',
                    disputeReason: liability.disputeReason,
                    disputeOpenedAt: liability.disputeOpenedAt,
                },
                { status: 400 }
            );
        }

        // Validate disputable status
        if (!isLiabilityDisputable(liability.status)) {
            return NextResponse.json(
                {
                    error: `Cannot dispute liability in status '${liability.status}'`,
                    code: 'LIABILITY_NOT_DISPUTABLE',
                    currentStatus: liability.status,
                },
                { status: 400 }
            );
        }

        const now = new Date();
        const effDate = effectiveDate ? new Date(effectiveDate) : now;

        // Update liability
        const updated = await (prisma as any).liability.update({
            where: { id: liability.id },
            data: {
                status: LiabilityStatus.IN_DISPUTE,
                previousStatus: liability.status,
                statusChangedAt: now,
                statusChangedBy: session.user.id,
                isDisputed: true,
                disputeReason: reason,
                disputeAmount: disputeAmount ?? Number(liability.totalOutstanding),
                disputeOpenedAt: now,
                version: liability.version + 1,
                eventCount: liability.eventCount + 1,
            },
        });

        // Create event
        const eventId = `evt_${liability.liabilityId}_disputed_${now.getTime()}`;

        await (prisma as any).liabilityEvent.create({
            data: {
                eventId,
                liabilityId: liability.id,
                eventType: LiabilityEventType.LIABILITY_DISPUTED,
                timestamp: now,
                effectiveDate: effDate,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    status: LiabilityStatus.IN_DISPUTE,
                    reason,
                    disputeAmount: disputeAmount ?? Number(liability.totalOutstanding),
                    notes,
                },
                previousState: {
                    status: liability.status,
                    isDisputed: false,
                },
                previousEventId: liability.lastEventId,
                explanation: `Dispute opened for ${liability.liabilityId}. Reason: ${reason}`,
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
                disputeAmount: Number(updated.disputeAmount),
            },
            message: `Dispute opened for liability ${liability.liabilityId}`,
            eventId,
        });
    } catch (error) {
        console.error('Error opening dispute:', error);
        return NextResponse.json(
            { error: 'Failed to open dispute' },
            { status: 500 }
        );
    }
}

// =============================================================================
// DELETE - Resolve Dispute
// =============================================================================

export async function DELETE(
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
        const { resolution, adjustedAmount, notes } = body;

        // Validate resolution
        if (!resolution?.trim()) {
            return NextResponse.json(
                { error: 'Resolution is required' },
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

        // Check if disputed
        if (!liability.isDisputed) {
            return NextResponse.json(
                { error: 'Liability is not in dispute', code: 'NOT_DISPUTED' },
                { status: 400 }
            );
        }

        const now = new Date();

        // Determine new status after resolution
        let newStatus = liability.previousStatus || LiabilityStatus.ACTIVE;

        // If amount was adjusted, might need to update balances
        let updateData: any = {
            status: newStatus,
            previousStatus: liability.status,
            statusChangedAt: now,
            statusChangedBy: session.user.id,
            isDisputed: false,
            disputeResolvedAt: now,
            disputeResolution: resolution,
            version: liability.version + 1,
            eventCount: liability.eventCount + 1,
        };

        if (adjustedAmount !== undefined && adjustedAmount !== null) {
            // Dispute resolved with adjusted amount
            const adjustment = Number(liability.totalOutstanding) - adjustedAmount;
            updateData.outstandingPrincipal = Math.max(0, Number(liability.outstandingPrincipal) - adjustment);
            updateData.totalOutstanding = adjustedAmount;
            updateData.expectedCashImpact = adjustedAmount;

            if (adjustedAmount <= 0) {
                newStatus = LiabilityStatus.FULLY_SETTLED;
                updateData.status = newStatus;
                updateData.settledDate = now;
            }
        }

        // Update liability
        const updated = await (prisma as any).liability.update({
            where: { id: liability.id },
            data: updateData,
        });

        // Create event
        const eventId = `evt_${liability.liabilityId}_dispute_resolved_${now.getTime()}`;

        await (prisma as any).liabilityEvent.create({
            data: {
                eventId,
                liabilityId: liability.id,
                eventType: LiabilityEventType.LIABILITY_AMENDED,
                timestamp: now,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    action: 'dispute_resolved',
                    resolution,
                    adjustedAmount,
                    notes,
                    previousStatus: liability.status,
                    newStatus,
                },
                previousState: {
                    status: liability.status,
                    isDisputed: true,
                    disputeReason: liability.disputeReason,
                    totalOutstanding: Number(liability.totalOutstanding),
                },
                previousEventId: liability.lastEventId,
                explanation: `Dispute resolved for ${liability.liabilityId}. Resolution: ${resolution}`,
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
            message: `Dispute resolved for liability ${liability.liabilityId}`,
            eventId,
        });
    } catch (error) {
        console.error('Error resolving dispute:', error);
        return NextResponse.json(
            { error: 'Failed to resolve dispute' },
            { status: 500 }
        );
    }
}