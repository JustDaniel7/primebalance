// =============================================================================
// DUNNING API - Dispute Management (TS Section 14)
// src/app/api/dunning/[id]/dispute/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    DunningStatus,
    DunningEventType,
    DisputeStatus,
    generateEventId,
    canBeDisputed,
} from '@/types/dunning';

// =============================================================================
// POST - Open Dispute (TS Section 14.1)
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
            disputeType,
            description,
            disputedAmount,
            attachments,
        } = body;

        if (!reason?.trim()) {
            return NextResponse.json(
                { error: 'Dispute reason is required' },
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

        // Check if can be disputed
        if (!canBeDisputed(dunning.status)) {
            return NextResponse.json(
                {
                    error: `Cannot dispute dunning in status '${dunning.status}'`,
                    code: 'INVALID_STATUS_FOR_DISPUTE',
                },
                { status: 400 }
            );
        }

        // Check if already disputed
        if (dunning.isDisputed) {
            return NextResponse.json(
                {
                    error: 'Dunning is already in dispute',
                    code: 'ALREADY_DISPUTED',
                },
                { status: 400 }
            );
        }

        const now = new Date();

        // Create dispute record
        const disputeId = `DSP-${dunning.dunningId}-${now.getTime()}`;
        const slaDeadline = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days SLA

        const dispute = await (prisma as any).dunningDisputeRecord.create({
            data: {
                disputeId,
                dunningId: dunning.id,
                status: DisputeStatus.OPEN,
                disputeType,
                reason,
                description,
                disputedAmount,
                currency: dunning.currency,
                attachments,
                slaDeadline,
                openedAt: now,
                openedBy: session.user.id,
                organizationId: session.user.organizationId,
            },
        });

        // Update dunning
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: {
                status: DunningStatus.DISPUTED,
                previousStatus: dunning.status,
                statusChangedAt: now,
                isDisputed: true,
                disputedAt: now,
                disputedBy: session.user.id,
                disputeReason: reason,
                disputeAmount: disputedAmount,
                hasActiveProposal: false,
                activeProposalId: null,
                activeProposalLevel: null,
                eventCount: dunning.eventCount + 1,
                systemTags: [...(dunning.systemTags || []).filter((t: string) => t !== 'disputed'), 'disputed'],
            },
        });

        // Create event
        const eventId = generateEventId(dunning.dunningId, DunningEventType.DUNNING_DISPUTED, now);

        await (prisma as any).dunningEvent.create({
            data: {
                eventId,
                dunningId: dunning.id,
                eventType: DunningEventType.DUNNING_DISPUTED,
                timestamp: now,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    disputeId,
                    reason,
                    disputeType,
                    disputedAmount,
                    previousStatus: dunning.status,
                },
                explanation: `Dispute opened for ${dunning.dunningNumber}. Reason: ${reason}. Dunning process blocked.`,
                previousEventId: dunning.lastEventId,
            },
        });

        // Update last event ID
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: { lastEventId: eventId },
        });

        return NextResponse.json({
            dispute: {
                ...dispute,
                disputedAmount: dispute.disputedAmount ? Number(dispute.disputedAmount) : null,
            },
            dunning: {
                dunningId: dunning.dunningId,
                dunningNumber: dunning.dunningNumber,
                status: DunningStatus.DISPUTED,
            },
            message: 'Dispute opened. Dunning process is now blocked until resolved.',
            eventId,
        }, { status: 201 });
    } catch (error) {
        console.error('Error opening dispute:', error);
        return NextResponse.json(
            { error: 'Failed to open dispute' },
            { status: 500 }
        );
    }
}

// =============================================================================
// GET - Get Dispute Details
// =============================================================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

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
            select: { id: true, dunningId: true, dunningNumber: true },
        });

        if (!dunning) {
            return NextResponse.json({ error: 'Dunning record not found' }, { status: 404 });
        }

        // Get disputes
        const disputes = await (prisma as any).dunningDisputeRecord.findMany({
            where: { dunningId: dunning.id },
            orderBy: { openedAt: 'desc' },
        });

        return NextResponse.json({
            dunningId: dunning.dunningId,
            dunningNumber: dunning.dunningNumber,
            disputes: disputes.map((d: any) => ({
                ...d,
                disputedAmount: d.disputedAmount ? Number(d.disputedAmount) : null,
                adjustedAmount: d.adjustedAmount ? Number(d.adjustedAmount) : null,
            })),
            activeDispute: disputes.find((d: any) => d.status === DisputeStatus.OPEN || d.status === DisputeStatus.UNDER_REVIEW),
        });
    } catch (error) {
        console.error('Error fetching disputes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch disputes' },
            { status: 500 }
        );
    }
}