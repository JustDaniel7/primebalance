// =============================================================================
// DUNNING API - Write-Off
// src/app/api/dunning/[id]/write-off/route.ts
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
// POST - Write Off Dunning
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
        const { reason, reasonCode, amount, notes } = body;

        if (!reason?.trim()) {
            return NextResponse.json(
                { error: 'Write-off reason is required' },
                { status: 400 }
            );
        }

        if (!reasonCode?.trim()) {
            return NextResponse.json(
                { error: 'Write-off reason code is required' },
                { status: 400 }
            );
        }

        // Valid reason codes
        const validReasonCodes = ['bad_debt', 'statute_of_limitations', 'customer_bankruptcy', 'settlement', 'uncollectible', 'other'];
        if (!validReasonCodes.includes(reasonCode)) {
            return NextResponse.json(
                {
                    error: 'Invalid reason code',
                    validCodes: validReasonCodes,
                },
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

        // Cannot write off already settled or written off
        if ([DunningStatus.SETTLED, DunningStatus.WRITTEN_OFF].includes(dunning.status)) {
            return NextResponse.json(
                {
                    error: `Cannot write off dunning in status '${dunning.status}'`,
                    code: 'INVALID_STATUS_FOR_WRITEOFF',
                },
                { status: 400 }
            );
        }

        const now = new Date();
        const writeOffAmount = amount !== undefined ? amount : Number(dunning.totalDue);

        // Update dunning
        const updated = await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: {
                status: DunningStatus.WRITTEN_OFF,
                previousStatus: dunning.status,
                statusChangedAt: now,
                outstandingAmount: 0,
                interestAccrued: 0,
                feesAccrued: 0,
                totalDue: 0,
                writtenOffAt: now,
                writtenOffBy: session.user.id,
                writtenOffAmount: writeOffAmount,
                writeOffReason: reason,
                writeOffReasonCode: reasonCode,
                hasActiveProposal: false,
                activeProposalId: null,
                activeProposalLevel: null,
                eventCount: dunning.eventCount + 1,
                systemTags: [...(dunning.systemTags || []), 'written_off'],
            },
        });

        // Create event
        const eventId = generateEventId(dunning.dunningId, DunningEventType.DUNNING_WRITTEN_OFF, now);

        await (prisma as any).dunningEvent.create({
            data: {
                eventId,
                dunningId: dunning.id,
                eventType: DunningEventType.DUNNING_WRITTEN_OFF,
                timestamp: now,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    writeOffAmount,
                    reason,
                    reasonCode,
                    notes,
                    previousOutstanding: Number(dunning.totalDue),
                },
                explanation: `Dunning ${dunning.dunningNumber} written off. Amount: ${dunning.currency} ${writeOffAmount.toLocaleString()}. Reason: ${reason} (${reasonCode})`,
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
                status: DunningStatus.WRITTEN_OFF,
                writtenOffAmount: writeOffAmount,
                currency: dunning.currency,
            },
            writeOff: {
                amount: writeOffAmount,
                reason,
                reasonCode,
                date: now.toISOString(),
            },
            message: `Dunning written off. Amount: ${dunning.currency} ${writeOffAmount.toLocaleString()}`,
            eventId,
        });
    } catch (error) {
        console.error('Error writing off dunning:', error);
        return NextResponse.json(
            { error: 'Failed to write off dunning' },
            { status: 500 }
        );
    }
}