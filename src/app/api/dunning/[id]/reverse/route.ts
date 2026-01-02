// =============================================================================
// DUNNING API - Reversal (TS Section 4.3)
// src/app/api/dunning/[id]/reverse/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    DunningStatus,
    DunningEventType,
    generateEventId,
} from '@/types/dunning';

// =============================================================================
// POST - Reverse Dunning (TS Section 4.3)
// Creates explicit DunningReversed event, no destructive deletes
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
            reason,
            reversalType = 'full', // 'full' | 'partial'
            amount, // For partial reversal
            notes,
        } = body;

        if (!reason?.trim()) {
            return NextResponse.json(
                { error: 'Reversal reason is required' },
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

        // Cannot reverse settled or written-off
        if ([DunningStatus.SETTLED, DunningStatus.WRITTEN_OFF].includes(dunning.status)) {
            return NextResponse.json(
                {
                    error: `Cannot reverse dunning in status '${dunning.status}'`,
                    code: 'INVALID_STATUS_FOR_REVERSAL',
                },
                { status: 400 }
            );
        }

        const now = new Date();

        // Store state before reversal
        const stateBeforeReversal = {
            status: dunning.status,
            currentLevel: dunning.currentLevel,
            outstandingAmount: Number(dunning.outstandingAmount),
            interestAccrued: Number(dunning.interestAccrued),
            feesAccrued: Number(dunning.feesAccrued),
            totalDue: Number(dunning.totalDue),
            reminderSentAt: dunning.reminderSentAt,
            dunningLevel1SentAt: dunning.dunningLevel1SentAt,
            dunningLevel2SentAt: dunning.dunningLevel2SentAt,
            dunningLevel3SentAt: dunning.dunningLevel3SentAt,
        };

        // Calculate new state based on reversal type
        let updateData: any = {
            eventCount: dunning.eventCount + 1,
        };

        if (reversalType === 'full') {
            // Full reversal - reset to overdue state, clear all levels
            updateData = {
                ...updateData,
                status: DunningStatus.OVERDUE,
                previousStatus: dunning.status,
                statusChangedAt: now,
                currentLevel: 0,
                interestAccrued: 0,
                feesAccrued: 0,
                totalDue: dunning.outstandingAmount,
                hasActiveProposal: false,
                activeProposalId: null,
                activeProposalLevel: null,
                reminderProposedAt: null,
                reminderApprovedAt: null,
                reminderApprovedBy: null,
                reminderSentAt: null,
                dunningLevel1ProposedAt: null,
                dunningLevel1ApprovedAt: null,
                dunningLevel1ApprovedBy: null,
                dunningLevel1SentAt: null,
                dunningLevel2ProposedAt: null,
                dunningLevel2ApprovedAt: null,
                dunningLevel2ApprovedBy: null,
                dunningLevel2SentAt: null,
                dunningLevel3InitiatedAt: null,
                dunningLevel3InitiatedBy: null,
                dunningLevel3ApprovedAt: null,
                dunningLevel3ApprovedBy: [],
                dunningLevel3SentAt: null,
            };
        } else if (reversalType === 'partial' && amount !== undefined) {
            // Partial reversal - adjust amounts
            const newOutstanding = Math.max(0, Number(dunning.outstandingAmount) - amount);
            updateData = {
                ...updateData,
                outstandingAmount: newOutstanding,
                totalDue: newOutstanding + Number(dunning.interestAccrued) + Number(dunning.feesAccrued),
                // If reduced to zero, mark as settled
                ...(newOutstanding <= 0 && {
                    status: DunningStatus.SETTLED,
                    previousStatus: dunning.status,
                    statusChangedAt: now,
                    settledAt: now,
                }),
            };
        }

        // Update dunning
        const updated = await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: updateData,
        });

        // Mark all prior events as reversed (for full reversal)
        if (reversalType === 'full') {
            await (prisma as any).dunningEvent.updateMany({
                where: {
                    dunningId: dunning.id,
                    eventType: {
                        in: [
                            DunningEventType.REMINDER_AUTO_PROPOSED,
                            DunningEventType.REMINDER_APPROVED,
                            DunningEventType.REMINDER_SENT,
                            DunningEventType.DUNNING_LEVEL1_AUTO_PROPOSED,
                            DunningEventType.DUNNING_LEVEL1_APPROVED,
                            DunningEventType.DUNNING_LEVEL1_SENT,
                            DunningEventType.DUNNING_LEVEL2_AUTO_PROPOSED,
                            DunningEventType.DUNNING_LEVEL2_APPROVED,
                            DunningEventType.DUNNING_LEVEL2_SENT,
                            DunningEventType.DUNNING_LEVEL3_MANUALLY_INITIATED,
                            DunningEventType.DUNNING_LEVEL3_APPROVED,
                            DunningEventType.DUNNING_LEVEL3_SENT,
                            DunningEventType.INTEREST_ACCRUED,
                            DunningEventType.FEE_APPLIED,
                        ],
                    },
                    isReversed: false,
                },
                data: {
                    isReversed: true,
                },
            });
        }

        // Create reversal event
        const eventId = generateEventId(dunning.dunningId, DunningEventType.DUNNING_REVERSED, now);

        await (prisma as any).dunningEvent.create({
            data: {
                eventId,
                dunningId: dunning.id,
                eventType: DunningEventType.DUNNING_REVERSED,
                timestamp: now,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    reversalType,
                    amount: reversalType === 'partial' ? amount : null,
                    reason,
                    notes,
                    stateBeforeReversal,
                },
                previousState: stateBeforeReversal,
                explanation: reversalType === 'full'
                    ? `Full reversal of ${dunning.dunningNumber}. Reason: ${reason}. All dunning levels cleared.`
                    : `Partial reversal of ${dunning.dunningNumber}. Amount: ${dunning.currency} ${amount.toLocaleString()}. Reason: ${reason}`,
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
                status: updated.status,
                currentLevel: updated.currentLevel,
                outstandingAmount: Number(updated.outstandingAmount),
                interestAccrued: Number(updated.interestAccrued),
                feesAccrued: Number(updated.feesAccrued),
                totalDue: Number(updated.totalDue),
                currency: dunning.currency,
            },
            reversal: {
                type: reversalType,
                amount: reversalType === 'partial' ? amount : Number(dunning.totalDue),
                reason,
                stateBeforeReversal,
            },
            message: reversalType === 'full'
                ? `Dunning fully reversed. Reset to overdue status.`
                : `Partial reversal applied. New outstanding: ${dunning.currency} ${Number(updated.outstandingAmount).toLocaleString()}`,
            eventId,
        });
    } catch (error) {
        console.error('Error reversing dunning:', error);
        return NextResponse.json(
            { error: 'Failed to reverse dunning' },
            { status: 500 }
        );
    }
}