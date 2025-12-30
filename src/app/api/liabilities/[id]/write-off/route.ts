// =============================================================================
// LIABILITIES API - Write-Off (TS Sections 5, 16)
// src/app/api/liabilities/[id]/write-off/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    LiabilityStatus,
    LiabilityEventType,
    isLiabilityWriteOffable,
} from '@/types/liabilities';

// =============================================================================
// POST - Write-Off Liability
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
        const { reason, reasonCode, amount, approvedBy, notes } = body;

        // Validate required fields (TS Section 5.2)
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
        const validReasonCodes = ['bad_debt', 'statute_of_limitations', 'settlement', 'other'];
        if (!validReasonCodes.includes(reasonCode)) {
            return NextResponse.json(
                { error: `Invalid reason code. Must be one of: ${validReasonCodes.join(', ')}` },
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

        // Validate write-off eligibility
        if (!isLiabilityWriteOffable(liability.status)) {
            return NextResponse.json(
                {
                    error: `Cannot write off liability in status '${liability.status}'`,
                    code: 'LIABILITY_NOT_WRITEOFFABLE',
                    currentStatus: liability.status,
                },
                { status: 400 }
            );
        }

        const now = new Date();
        const writeOffAmount = amount ?? Number(liability.totalOutstanding);

        // Update liability
        const updated = await (prisma as any).liability.update({
            where: { id: liability.id },
            data: {
                status: LiabilityStatus.WRITTEN_OFF,
                previousStatus: liability.status,
                statusChangedAt: now,
                statusChangedBy: session.user.id,
                isWrittenOff: true,
                writeOffDate: now,
                writeOffAmount,
                writeOffReason: reason,
                writeOffReasonCode: reasonCode,
                writeOffApprovedBy: approvedBy || session.user.id,
                outstandingPrincipal: 0,
                accruedInterest: 0,
                feesPenalties: 0,
                totalOutstanding: 0,
                expectedCashImpact: 0,
                version: liability.version + 1,
                eventCount: liability.eventCount + 1,
            },
        });

        // Create event
        const eventId = `evt_${liability.liabilityId}_written_off_${now.getTime()}`;

        await (prisma as any).liabilityEvent.create({
            data: {
                eventId,
                liabilityId: liability.id,
                eventType: LiabilityEventType.LIABILITY_WRITTEN_OFF,
                timestamp: now,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    status: LiabilityStatus.WRITTEN_OFF,
                    writeOffAmount,
                    reason,
                    reasonCode,
                    approvedBy: approvedBy || session.user.id,
                    notes,
                },
                previousState: {
                    status: liability.status,
                    outstandingPrincipal: Number(liability.outstandingPrincipal),
                    accruedInterest: Number(liability.accruedInterest),
                    feesPenalties: Number(liability.feesPenalties),
                    totalOutstanding: Number(liability.totalOutstanding),
                },
                previousEventId: liability.lastEventId,
                explanation: `Liability ${liability.liabilityId} written off. Amount: ${liability.currency} ${writeOffAmount.toLocaleString()}. Reason: ${reason} (${reasonCode})`,
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
                writeOffAmount: Number(updated.writeOffAmount),
            },
            message: `Liability ${liability.liabilityId} written off`,
            eventId,
        });
    } catch (error) {
        console.error('Error writing off liability:', error);
        return NextResponse.json(
            { error: 'Failed to write off liability' },
            { status: 500 }
        );
    }
}