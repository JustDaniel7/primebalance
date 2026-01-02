// =============================================================================
// DUNNING API - Settlement (TS Section 9.6)
// src/app/api/dunning/[id]/settle/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    DunningStatus,
    DunningEventType,
    generateEventId,
    canBeSettled,
} from '@/types/dunning';

// =============================================================================
// POST - Settle Dunning (Full or Partial)
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
        const {
            amount,
            settlementDate,
            reference,
            paymentMethod,
            notes,
            isPartial = false,
        } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Settlement amount must be greater than 0' },
                { status: 400 }
            );
        }

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
        });

        if (!dunning) {
            return NextResponse.json({ error: 'Dunning record not found' }, { status: 404 });
        }

        // Validate can be settled
        if (!canBeSettled(dunning.status)) {
            return NextResponse.json(
                {
                    error: `Cannot settle dunning in status '${dunning.status}'`,
                    code: 'INVALID_STATUS_FOR_SETTLEMENT',
                },
                { status: 400 }
            );
        }

        const now = new Date();
        const effectiveDate = settlementDate ? new Date(settlementDate) : now;

        const outstandingBefore = Number(dunning.totalDue);
        const settlementAmount = Math.min(amount, outstandingBefore);
        const outstandingAfter = outstandingBefore - settlementAmount;

        // Determine if fully settled
        const isFullSettlement = outstandingAfter <= 0.01; // Allow for rounding

        // Calculate new amounts
        const newOutstandingPrincipal = Math.max(0, Number(dunning.outstandingAmount) - settlementAmount);
        const newInterestAccrued = Math.max(0, Number(dunning.interestAccrued) - Math.max(0, settlementAmount - Number(dunning.outstandingAmount)));
        const newFeesAccrued = Math.max(0, Number(dunning.feesAccrued) - Math.max(0, settlementAmount - Number(dunning.outstandingAmount) - Number(dunning.interestAccrued)));
        const newTotalDue = newOutstandingPrincipal + newInterestAccrued + newFeesAccrued;

        // Update dunning
        const updateData: any = {
            outstandingAmount: newOutstandingPrincipal,
            interestAccrued: newInterestAccrued,
            feesAccrued: newFeesAccrued,
            totalDue: newTotalDue,
            eventCount: dunning.eventCount + 1,
        };

        if (isFullSettlement) {
            updateData.status = DunningStatus.SETTLED;
            updateData.previousStatus = dunning.status;
            updateData.statusChangedAt = now;
            updateData.settledAt = effectiveDate;
            updateData.settledBy = session.user.id;
            updateData.settledAmount = (Number(dunning.settledAmount) || 0) + settlementAmount;
            updateData.settlementReference = reference;
            updateData.hasActiveProposal = false;
            updateData.activeProposalId = null;
            updateData.activeProposalLevel = null;
        } else {
            updateData.settledAmount = (Number(dunning.settledAmount) || 0) + settlementAmount;
        }

        const updated = await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: updateData,
        });

        // Create event
        const eventType = isFullSettlement
            ? DunningEventType.DUNNING_SETTLED
            : DunningEventType.DUNNING_PARTIALLY_SETTLED;

        const eventId = generateEventId(dunning.dunningId, eventType, now);

        await (prisma as any).dunningEvent.create({
            data: {
                eventId,
                dunningId: dunning.id,
                eventType,
                timestamp: now,
                effectiveDate,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    settlementAmount,
                    outstandingBefore,
                    outstandingAfter: newTotalDue,
                    isFullSettlement,
                    reference,
                    paymentMethod,
                    notes,
                },
                explanation: isFullSettlement
                    ? `Dunning ${dunning.dunningNumber} fully settled. Amount: ${dunning.currency} ${settlementAmount.toLocaleString()}`
                    : `Partial payment received for ${dunning.dunningNumber}. Amount: ${dunning.currency} ${settlementAmount.toLocaleString()}. Remaining: ${dunning.currency} ${newTotalDue.toLocaleString()}`,
                previousEventId: dunning.lastEventId,
            },
        });

        // Update last event ID
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: { lastEventId: eventId },
        });

        return NextResponse.json({
            dunning: {
                dunningId: dunning.dunningId,
                dunningNumber: dunning.dunningNumber,
                status: isFullSettlement ? DunningStatus.SETTLED : dunning.status,
                outstandingAmount: newOutstandingPrincipal,
                interestAccrued: newInterestAccrued,
                feesAccrued: newFeesAccrued,
                totalDue: newTotalDue,
                currency: dunning.currency,
            },
            settlement: {
                amount: settlementAmount,
                outstandingBefore,
                outstandingAfter: newTotalDue,
                isFullSettlement,
                reference,
                effectiveDate: effectiveDate.toISOString(),
            },
            message: isFullSettlement
                ? `Dunning fully settled. Amount: ${dunning.currency} ${settlementAmount.toLocaleString()}`
                : `Partial payment recorded. Amount: ${dunning.currency} ${settlementAmount.toLocaleString()}. Remaining: ${dunning.currency} ${newTotalDue.toLocaleString()}`,
            eventId,
        });
    } catch (error) {
        console.error('Error settling dunning:', error);
        return NextResponse.json(
            { error: 'Failed to settle dunning' },
            { status: 500 }
        );
    }
}