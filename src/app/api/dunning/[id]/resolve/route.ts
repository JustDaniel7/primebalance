// =============================================================================
// DUNNING API - Resolve Dispute (TS Section 14.2)
// src/app/api/dunning/[id]/resolve/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyDunningResolved } from '@/lib/notifications';
import {
    DunningStatus,
    DunningEventType,
    DisputeStatus,
    DisputeResolutionType,
    generateEventId,
} from '@/types/dunning';

// =============================================================================
// POST - Resolve Dispute
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
            disputeId,
            resolution,
            resolutionType,
            adjustedAmount,
            notes,
        } = body;

        if (!resolution?.trim()) {
            return NextResponse.json(
                { error: 'Resolution description is required' },
                { status: 400 }
            );
        }

        if (!resolutionType) {
            return NextResponse.json(
                { error: 'Resolution type is required' },
                { status: 400 }
            );
        }

        const validTypes = Object.values(DisputeResolutionType);
        if (!validTypes.includes(resolutionType)) {
            return NextResponse.json(
                {
                    error: 'Invalid resolution type',
                    validTypes,
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

        // Validate disputed status
        if (!dunning.isDisputed) {
            return NextResponse.json(
                {
                    error: 'Dunning is not currently disputed',
                    code: 'NOT_DISPUTED',
                },
                { status: 400 }
            );
        }

        // Find active dispute
        const where: any = {
            dunningId: dunning.id,
            status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
        };
        if (disputeId) {
            where.OR = [{ id: disputeId }, { disputeId }];
        }

        const dispute = await (prisma as any).dunningDisputeRecord.findFirst({
            where,
            orderBy: { openedAt: 'desc' },
        });

        if (!dispute) {
            return NextResponse.json(
                { error: 'No active dispute found' },
                { status: 404 }
            );
        }

        const now = new Date();

        // Update dispute
        await (prisma as any).dunningDisputeRecord.update({
            where: { id: dispute.id },
            data: {
                status: DisputeStatus.RESOLVED,
                resolution,
                resolutionType,
                adjustedAmount,
                resolvedAt: now,
                resolvedBy: session.user.id,
            },
        });

        // Determine new dunning state
        let newStatus: DunningStatus;
        let newOutstanding = Number(dunning.outstandingAmount);
        let newTotalDue = Number(dunning.totalDue);

        switch (resolutionType) {
            case DisputeResolutionType.UPHELD:
                // Dispute upheld - adjust amount or write off
                if (adjustedAmount !== undefined) {
                    newOutstanding = adjustedAmount;
                    newTotalDue = adjustedAmount + Number(dunning.interestAccrued) + Number(dunning.feesAccrued);
                }
                newStatus = adjustedAmount <= 0 ? DunningStatus.SETTLED : dunning.previousStatus || DunningStatus.OVERDUE;
                break;

            case DisputeResolutionType.REJECTED:
                // Dispute rejected - resume dunning at previous state
                newStatus = dunning.previousStatus || DunningStatus.OVERDUE;
                break;

            case DisputeResolutionType.PARTIAL:
                // Partial - adjust amount
                if (adjustedAmount !== undefined) {
                    newOutstanding = adjustedAmount;
                    newTotalDue = adjustedAmount + Number(dunning.interestAccrued) + Number(dunning.feesAccrued);
                }
                newStatus = dunning.previousStatus || DunningStatus.OVERDUE;
                break;

            case DisputeResolutionType.WITHDRAWN:
                // Dispute withdrawn by customer - resume
                newStatus = dunning.previousStatus || DunningStatus.OVERDUE;
                break;

            default:
                newStatus = dunning.previousStatus || DunningStatus.OVERDUE;
        }

        // Update dunning
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: {
                status: newStatus,
                previousStatus: DunningStatus.DISPUTED,
                statusChangedAt: now,
                isDisputed: false,
                disputeResolvedAt: now,
                disputeResolvedBy: session.user.id,
                disputeResolution: resolution,
                outstandingAmount: newOutstanding,
                totalDue: newTotalDue,
                eventCount: dunning.eventCount + 1,
                systemTags: (dunning.systemTags || []).filter((t: string) => t !== 'disputed'),
            },
        });

        // Create event
        const eventId = generateEventId(dunning.dunningId, DunningEventType.DISPUTE_RESOLVED, now);

        await (prisma as any).dunningEvent.create({
            data: {
                eventId,
                dunningId: dunning.id,
                eventType: DunningEventType.DISPUTE_RESOLVED,
                timestamp: now,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    disputeId: dispute.disputeId,
                    resolution,
                    resolutionType,
                    adjustedAmount,
                    previousOutstanding: Number(dunning.outstandingAmount),
                    newOutstanding,
                    newStatus,
                    notes,
                },
                explanation: `Dispute resolved for ${dunning.dunningNumber}. Resolution: ${resolutionType}. ${resolution}`,
                previousEventId: dunning.lastEventId,
            },
        });

        // Update last event ID
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: { lastEventId: eventId },
        });

        // Notify admins about the resolved dunning
        await notifyDunningResolved({
            dunningId: dunning.id,
            dunningNumber: dunning.dunningNumber,
            customerName: dunning.customerName || 'Unknown',
            amount: newOutstanding,
            currency: dunning.currency,
            organizationId: session.user.organizationId,
            actorId: session.user.id,
            actorName: session.user.name || session.user.email,
        });

        return NextResponse.json({
            dispute: {
                disputeId: dispute.disputeId,
                status: DisputeStatus.RESOLVED,
                resolution,
                resolutionType,
                adjustedAmount,
                resolvedAt: now.toISOString(),
            },
            dunning: {
                dunningId: dunning.dunningId,
                dunningNumber: dunning.dunningNumber,
                status: newStatus,
                outstandingAmount: newOutstanding,
                totalDue: newTotalDue,
                currency: dunning.currency,
            },
            message: `Dispute resolved. Resolution: ${resolutionType}. Dunning status: ${newStatus}`,
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