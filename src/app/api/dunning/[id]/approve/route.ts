// =============================================================================
// DUNNING API - Approve Proposal (TS Sections 8, 9.3)
// src/app/api/dunning/[id]/approve/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    DunningStatus,
    DunningEventType,
    DunningLevel,
    ProposalStatus,
    generateEventId,
} from '@/types/dunning';

// =============================================================================
// POST - Approve Proposal (TS Section 9.3 - Human-in-the-Loop)
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
            proposalId,
            notes,
            modifiedInterest,
            modifiedFees,
            deadline,
        } = body;

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

        // Find proposal
        const proposal = await (prisma as any).dunningProposal.findFirst({
            where: {
                dunningId: dunning.id,
                status: ProposalStatus.PENDING,
                ...(proposalId ? { OR: [{ id: proposalId }, { proposalId }] } : {}),
            },
        });

        if (!proposal) {
            return NextResponse.json(
                { error: 'No pending proposal found for this dunning' },
                { status: 404 }
            );
        }

        // Check if Level 3 - requires different approval process
        if (proposal.proposalLevel >= DunningLevel.LEVEL_3) {
            return NextResponse.json(
                {
                    error: 'Level 3 requires multi-signature approval. Use /approve-level3 endpoint.',
                    code: 'LEVEL3_MULTI_SIG_REQUIRED',
                },
                { status: 400 }
            );
        }

        const now = new Date();

        // Calculate final amounts
        const finalInterest = modifiedInterest !== undefined
            ? modifiedInterest
            : Number(proposal.interestProposed);
        const finalFees = modifiedFees !== undefined
            ? modifiedFees
            : Number(proposal.feesProposed);
        const finalTotal = Number(proposal.outstandingAmount) + finalInterest + finalFees;

        // Update proposal
        const updatedProposal = await (prisma as any).dunningProposal.update({
            where: { id: proposal.id },
            data: {
                status: ProposalStatus.APPROVED,
                approvedAt: now,
                approvedBy: session.user.id,
                interestProposed: finalInterest,
                feesProposed: finalFees,
                totalProposed: finalTotal,
                deadline: deadline ? new Date(deadline) : proposal.deadline,
            },
        });

        // Determine event type based on level
        let eventType: DunningEventType;
        switch (proposal.proposalLevel) {
            case DunningLevel.REMINDER:
                eventType = DunningEventType.REMINDER_APPROVED;
                break;
            case DunningLevel.LEVEL_1:
                eventType = DunningEventType.DUNNING_LEVEL1_APPROVED;
                break;
            case DunningLevel.LEVEL_2:
                eventType = DunningEventType.DUNNING_LEVEL2_APPROVED;
                break;
            default:
                eventType = DunningEventType.DUNNING_LEVEL1_APPROVED;
        }

        // Create event
        const eventId = generateEventId(dunning.dunningId, eventType, now);

        await (prisma as any).dunningEvent.create({
            data: {
                eventId,
                dunningId: dunning.id,
                eventType,
                timestamp: now,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    proposalId: proposal.proposalId,
                    proposalLevel: proposal.proposalLevel,
                    interestApproved: finalInterest,
                    feesApproved: finalFees,
                    totalApproved: finalTotal,
                    notes,
                    modified: modifiedInterest !== undefined || modifiedFees !== undefined,
                },
                explanation: `Proposal ${proposal.proposalId} approved by ${session.user.name || session.user.email}. ` +
                    `Total: ${dunning.currency} ${finalTotal.toLocaleString()}`,
                previousEventId: dunning.lastEventId,
            },
        });

        // Update dunning
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: {
                interestAccrued: Number(dunning.interestAccrued) + finalInterest,
                feesAccrued: Number(dunning.feesAccrued) + finalFees,
                totalDue: Number(dunning.outstandingAmount) + Number(dunning.interestAccrued) + finalInterest + Number(dunning.feesAccrued) + finalFees,
                lastEventId: eventId,
                eventCount: dunning.eventCount + 1,
                // Update level-specific timestamps
                ...(proposal.proposalLevel === DunningLevel.REMINDER && {
                    reminderApprovedAt: now,
                    reminderApprovedBy: session.user.id,
                }),
                ...(proposal.proposalLevel === DunningLevel.LEVEL_1 && {
                    dunningLevel1ApprovedAt: now,
                    dunningLevel1ApprovedBy: session.user.id,
                }),
                ...(proposal.proposalLevel === DunningLevel.LEVEL_2 && {
                    dunningLevel2ApprovedAt: now,
                    dunningLevel2ApprovedBy: session.user.id,
                }),
            },
        });

        return NextResponse.json({
            proposal: {
                ...updatedProposal,
                outstandingAmount: Number(updatedProposal.outstandingAmount),
                interestProposed: Number(updatedProposal.interestProposed),
                feesProposed: Number(updatedProposal.feesProposed),
                totalProposed: Number(updatedProposal.totalProposed),
                confidenceScore: Number(updatedProposal.confidenceScore),
            },
            dunningId: dunning.dunningId,
            dunningNumber: dunning.dunningNumber,
            message: `Proposal approved. Ready to send. Total: ${dunning.currency} ${finalTotal.toLocaleString()}`,
            eventId,
            nextStep: 'send', // Hint for UI
        });
    } catch (error) {
        console.error('Error approving proposal:', error);
        return NextResponse.json(
            { error: 'Failed to approve proposal' },
            { status: 500 }
        );
    }
}

// =============================================================================
// DELETE - Reject Proposal
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
        const { proposalId, reason } = body;

        if (!reason?.trim()) {
            return NextResponse.json(
                { error: 'Rejection reason is required' },
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

        // Find proposal
        const proposal = await (prisma as any).dunningProposal.findFirst({
            where: {
                dunningId: dunning.id,
                status: ProposalStatus.PENDING,
                ...(proposalId ? { OR: [{ id: proposalId }, { proposalId }] } : {}),
            },
        });

        if (!proposal) {
            return NextResponse.json(
                { error: 'No pending proposal found for this dunning' },
                { status: 404 }
            );
        }

        const now = new Date();

        // Update proposal
        const updatedProposal = await (prisma as any).dunningProposal.update({
            where: { id: proposal.id },
            data: {
                status: ProposalStatus.REJECTED,
                rejectedAt: now,
                rejectedBy: session.user.id,
                rejectionReason: reason,
            },
        });

        // Create event
        const eventId = generateEventId(dunning.dunningId, 'ProposalRejected', now);

        await (prisma as any).dunningEvent.create({
            data: {
                eventId,
                dunningId: dunning.id,
                eventType: 'ProposalRejected',
                timestamp: now,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    proposalId: proposal.proposalId,
                    proposalLevel: proposal.proposalLevel,
                    reason,
                },
                explanation: `Proposal ${proposal.proposalId} rejected. Reason: ${reason}`,
                previousEventId: dunning.lastEventId,
            },
        });

        // Revert dunning status to previous
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: {
                status: dunning.previousStatus || DunningStatus.OVERDUE,
                hasActiveProposal: false,
                activeProposalId: null,
                activeProposalLevel: null,
                lastEventId: eventId,
                eventCount: dunning.eventCount + 1,
            },
        });

        return NextResponse.json({
            proposal: {
                ...updatedProposal,
                outstandingAmount: Number(updatedProposal.outstandingAmount),
                interestProposed: Number(updatedProposal.interestProposed),
                feesProposed: Number(updatedProposal.feesProposed),
                totalProposed: Number(updatedProposal.totalProposed),
                confidenceScore: Number(updatedProposal.confidenceScore),
            },
            dunningId: dunning.dunningId,
            message: 'Proposal rejected',
            eventId,
        });
    } catch (error) {
        console.error('Error rejecting proposal:', error);
        return NextResponse.json(
            { error: 'Failed to reject proposal' },
            { status: 500 }
        );
    }
}