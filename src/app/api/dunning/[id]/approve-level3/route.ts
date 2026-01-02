// =============================================================================
// DUNNING API - Approve Level 3 (Multi-Signature - TS Section 17.3)
// src/app/api/dunning/[id]/approve-level3/route.ts
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
// POST - Add Approval Signature for Level 3 (Multi-Sig)
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
        const { notes } = body;

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

        // Validate status
        if (dunning.status !== DunningStatus.DUNNING_LEVEL3_PENDING) {
            return NextResponse.json(
                {
                    error: 'Dunning is not pending Level 3 approval',
                    code: 'INVALID_STATUS',
                    currentStatus: dunning.status,
                },
                { status: 400 }
            );
        }

        // Find Level 3 proposal
        const proposal = await (prisma as any).dunningProposal.findFirst({
            where: {
                dunningId: dunning.id,
                proposalLevel: DunningLevel.LEVEL_3,
                status: ProposalStatus.PENDING,
            },
        });

        if (!proposal) {
            return NextResponse.json(
                { error: 'No pending Level 3 proposal found' },
                { status: 404 }
            );
        }

        const now = new Date();

        // Get current approvers
        const currentApprovers: string[] = dunning.dunningLevel3ApprovedBy || [];

        // Check if user already approved
        if (currentApprovers.includes(session.user.id)) {
            return NextResponse.json(
                {
                    error: 'You have already approved this Level 3 dunning',
                    code: 'ALREADY_APPROVED',
                },
                { status: 400 }
            );
        }

        // Add approval
        const newApprovers = [...currentApprovers, session.user.id];

        // Get required approvals
        const approvalRule = await (prisma as any).dunningAutomationRule.findFirst({
            where: {
                organizationId: session.user.organizationId,
                dunningLevels: { has: DunningLevel.LEVEL_3 },
                isActive: true,
            },
        });

        const requiredApprovals = approvalRule?.multiSignatureCount || 2;
        const isFullyApproved = newApprovers.length >= requiredApprovals;

        // Update dunning with new approver
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: {
                dunningLevel3ApprovedBy: newApprovers,
                ...(isFullyApproved && { dunningLevel3ApprovedAt: now }),
                eventCount: dunning.eventCount + 1,
            },
        });

        // Update proposal if fully approved
        if (isFullyApproved) {
            await (prisma as any).dunningProposal.update({
                where: { id: proposal.id },
                data: {
                    status: ProposalStatus.APPROVED,
                    approvedAt: now,
                    approvedBy: newApprovers.join(','),
                },
            });
        }

        // Create event
        const eventType = isFullyApproved
            ? DunningEventType.DUNNING_LEVEL3_APPROVED
            : 'Level3ApprovalAdded';

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
                    approver: session.user.id,
                    approverName: session.user.name || session.user.email,
                    currentApprovals: newApprovers.length,
                    requiredApprovals,
                    isFullyApproved,
                    notes,
                },
                explanation: isFullyApproved
                    ? `Level 3 fully approved with ${newApprovers.length} signatures. Ready to send.`
                    : `Level 3 approval ${newApprovers.length}/${requiredApprovals} added by ${session.user.name || session.user.email}`,
                previousEventId: dunning.lastEventId,
            },
        });

        // Update last event ID
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: { lastEventId: eventId },
        });

        return NextResponse.json({
            dunningId: dunning.dunningId,
            dunningNumber: dunning.dunningNumber,
            approval: {
                currentApprovals: newApprovers.length,
                requiredApprovals,
                approvers: newApprovers,
                isFullyApproved,
            },
            message: isFullyApproved
                ? `Level 3 fully approved (${newApprovers.length}/${requiredApprovals}). Ready to send.`
                : `Approval added (${newApprovers.length}/${requiredApprovals}). ${requiredApprovals - newApprovers.length} more required.`,
            eventId,
            nextStep: isFullyApproved ? 'send' : 'approve-level3',
        });
    } catch (error) {
        console.error('Error approving Level 3:', error);
        return NextResponse.json(
            { error: 'Failed to approve Level 3 dunning' },
            { status: 500 }
        );
    }
}

// =============================================================================
// DELETE - Remove Approval / Reject Level 3
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
        const { reason } = body;

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

        // Find Level 3 proposal
        const proposal = await (prisma as any).dunningProposal.findFirst({
            where: {
                dunningId: dunning.id,
                proposalLevel: DunningLevel.LEVEL_3,
                status: ProposalStatus.PENDING,
            },
        });

        if (!proposal) {
            return NextResponse.json(
                { error: 'No pending Level 3 proposal found' },
                { status: 404 }
            );
        }

        const now = new Date();

        // Reject proposal
        await (prisma as any).dunningProposal.update({
            where: { id: proposal.id },
            data: {
                status: ProposalStatus.REJECTED,
                rejectedAt: now,
                rejectedBy: session.user.id,
                rejectionReason: reason,
            },
        });

        // Revert dunning to Level 2 sent status
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: {
                status: DunningStatus.DUNNING_LEVEL2_SENT,
                previousStatus: dunning.status,
                statusChangedAt: now,
                hasActiveProposal: false,
                activeProposalId: null,
                activeProposalLevel: null,
                dunningLevel3InitiatedAt: null,
                dunningLevel3InitiatedBy: null,
                dunningLevel3ApprovedBy: [],
                eventCount: dunning.eventCount + 1,
            },
        });

        // Create event
        const eventId = generateEventId(dunning.dunningId, 'Level3Rejected', now);

        await (prisma as any).dunningEvent.create({
            data: {
                eventId,
                dunningId: dunning.id,
                eventType: 'Level3Rejected',
                timestamp: now,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    proposalId: proposal.proposalId,
                    reason,
                },
                explanation: `Level 3 rejected by ${session.user.name || session.user.email}. Reason: ${reason}. Reverted to Level 2 sent.`,
                previousEventId: dunning.lastEventId,
            },
        });

        // Update last event ID
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: { lastEventId: eventId },
        });

        return NextResponse.json({
            dunningId: dunning.dunningId,
            dunningNumber: dunning.dunningNumber,
            message: 'Level 3 rejected. Dunning reverted to Level 2 sent status.',
            eventId,
        });
    } catch (error) {
        console.error('Error rejecting Level 3:', error);
        return NextResponse.json(
            { error: 'Failed to reject Level 3 dunning' },
            { status: 500 }
        );
    }
}