// =============================================================================
// LIABILITIES API - Reversal (TS Sections 4.3, 19)
// src/app/api/liabilities/[id]/reverse/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    LiabilityStatus,
    LiabilityEventType,
} from '@/types/liabilities';

// =============================================================================
// POST - Reverse Liability (TS Section 4.3)
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
        const { reason, effectiveDate, reversalType = 'full', amount } = body;

        // Validate reason
        if (!reason?.trim()) {
            return NextResponse.json(
                { error: 'Reversal reason is required' },
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

        // Cannot reverse archived or already reversed
        if (liability.status === LiabilityStatus.ARCHIVED) {
            return NextResponse.json(
                {
                    error: 'Cannot reverse archived liability',
                    code: 'ARCHIVED_LIABILITY',
                },
                { status: 400 }
            );
        }

        const now = new Date();
        const effDate = effectiveDate ? new Date(effectiveDate) : now;

        // Get the creation event to restore original state
        const creationEvent = await (prisma as any).liabilityEvent.findFirst({
            where: {
                liabilityId: liability.id,
                eventType: LiabilityEventType.LIABILITY_CREATED,
            },
        });

        // Capture current state before reversal
        const stateBeforeReversal = {
            status: liability.status,
            outstandingPrincipal: Number(liability.outstandingPrincipal),
            accruedInterest: Number(liability.accruedInterest),
            feesPenalties: Number(liability.feesPenalties),
            totalOutstanding: Number(liability.totalOutstanding),
            totalSettled: Number(liability.totalSettled),
            version: liability.version,
        };

        let updateData: any = {};
        let eventPayload: any = {};

        if (reversalType === 'full') {
            // Full reversal - restore to draft with zero balances
            updateData = {
                status: LiabilityStatus.DRAFT,
                previousStatus: liability.status,
                statusChangedAt: now,
                statusChangedBy: session.user.id,
                outstandingPrincipal: Number(liability.originalPrincipal),
                accruedInterest: 0,
                feesPenalties: 0,
                totalOutstanding: Number(liability.originalPrincipal),
                totalSettled: 0,
                recognitionDate: null,
                activationDate: null,
                settledDate: null,
                lastPaymentDate: null,
                paymentsCompleted: 0,
                paymentsMissed: 0,
                isInDefault: false,
                defaultDate: null,
                defaultReason: null,
                daysOverdue: 0,
                isDisputed: false,
                disputeReason: null,
                disputeAmount: null,
                disputeOpenedAt: null,
                isRestructured: false,
                restructuredDate: null,
                isWrittenOff: false,
                writeOffDate: null,
                writeOffAmount: null,
            };

            eventPayload = {
                reversalType: 'full',
                reason,
                restoredTo: 'draft',
                originalState: stateBeforeReversal,
            };
        } else {
            // Partial reversal - just adjust the amount
            if (!amount || amount <= 0) {
                return NextResponse.json(
                    { error: 'Amount is required for partial reversal' },
                    { status: 400 }
                );
            }

            const newOutstanding = Number(liability.outstandingPrincipal) + amount;
            const newTotalSettled = Math.max(0, Number(liability.totalSettled) - amount);

            updateData = {
                outstandingPrincipal: newOutstanding,
                totalOutstanding: newOutstanding + Number(liability.accruedInterest) + Number(liability.feesPenalties),
                totalSettled: newTotalSettled,
                // Revert to active if was partially/fully settled
                status: liability.status === LiabilityStatus.FULLY_SETTLED ||
                liability.status === LiabilityStatus.PARTIALLY_SETTLED
                    ? LiabilityStatus.ACTIVE
                    : liability.status,
                previousStatus: liability.status,
                statusChangedAt: now,
                statusChangedBy: session.user.id,
                settledDate: null,
            };

            eventPayload = {
                reversalType: 'partial',
                amount,
                reason,
                originalState: stateBeforeReversal,
            };
        }

        // Increment version
        updateData.version = liability.version + 1;
        updateData.eventCount = liability.eventCount + 1;

        // Update liability
        const updated = await (prisma as any).liability.update({
            where: { id: liability.id },
            data: updateData,
        });

        // Create reversal event
        const eventId = `evt_${liability.liabilityId}_reversed_${now.getTime()}`;

        await (prisma as any).liabilityEvent.create({
            data: {
                eventId,
                liabilityId: liability.id,
                eventType: LiabilityEventType.LIABILITY_REVERSED,
                timestamp: now,
                effectiveDate: effDate,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: eventPayload,
                previousState: stateBeforeReversal,
                previousEventId: liability.lastEventId,
                explanation: `Liability ${liability.liabilityId} reversed (${reversalType}). Reason: ${reason}`,
            },
        });

        // Mark all related events as reversed (for full reversal)
        if (reversalType === 'full') {
            await (prisma as any).liabilityEvent.updateMany({
                where: {
                    liabilityId: liability.id,
                    eventType: { not: LiabilityEventType.LIABILITY_CREATED },
                    isReversed: false,
                },
                data: {
                    isReversed: true,
                    reversedBy: eventId,
                },
            });
        }

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
                accruedInterest: Number(updated.accruedInterest),
                feesPenalties: Number(updated.feesPenalties),
                totalOutstanding: Number(updated.totalOutstanding),
                totalSettled: Number(updated.totalSettled),
            },
            reversal: {
                eventId,
                reversalType,
                reason,
                effectiveDate: effDate.toISOString(),
                stateBeforeReversal,
            },
            message: `Liability ${liability.liabilityId} reversed successfully`,
        });
    } catch (error) {
        console.error('Error reversing liability:', error);
        return NextResponse.json(
            { error: 'Failed to reverse liability' },
            { status: 500 }
        );
    }
}