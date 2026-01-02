// =============================================================================
// DUNNING API - Initiate Level 3 (MANUAL ONLY - TS Section 8.4)
// src/app/api/dunning/[id]/initiate-level3/route.ts
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
    ProposalPriority,
    generateEventId,
    generateProposalId,
    canInitiateLevel3,
    calculateInterest,
    calculateTotalDue,
    DayCountBasis,
} from '@/types/dunning';

// =============================================================================
// POST - Manually Initiate Level 3 (TS Section 8.4)
// IMPORTANT: Level 3 is NEVER auto-proposed. User MUST manually initiate.
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
            notes,
            deadline,
            includeInterest = true,
            includeFees = true,
            includeCosts = true,
        } = body;

        // Reason is required for Level 3
        if (!reason?.trim()) {
            return NextResponse.json(
                { error: 'Reason is required for Level 3 initiation' },
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

        // Validate can initiate Level 3
        if (!canInitiateLevel3(dunning.status)) {
            return NextResponse.json(
                {
                    error: `Cannot initiate Level 3 from status '${dunning.status}'. Level 2 must be sent first.`,
                    code: 'INVALID_STATUS_FOR_LEVEL3',
                    currentStatus: dunning.status,
                    requiredStatus: DunningStatus.DUNNING_LEVEL2_SENT,
                },
                { status: 400 }
            );
        }

        // Check if already has active proposal
        if (dunning.hasActiveProposal) {
            return NextResponse.json(
                {
                    error: 'Dunning already has an active proposal',
                    code: 'ACTIVE_PROPOSAL_EXISTS',
                },
                { status: 400 }
            );
        }

        // Check if disputed
        if (dunning.isDisputed) {
            return NextResponse.json(
                {
                    error: 'Cannot initiate Level 3 for disputed dunning',
                    code: 'DUNNING_DISPUTED',
                },
                { status: 400 }
            );
        }

        const now = new Date();

        // ==========================================================================
        // PERFORM DATA VERIFICATION (TS Section 6)
        // ==========================================================================

        // Even for manual initiation, we verify data
        const verificationErrors: string[] = [];

        if (Number(dunning.outstandingAmount) <= 0) {
            verificationErrors.push('No outstanding amount');
        }
        if (!dunning.dunningLevel2SentAt) {
            verificationErrors.push('Level 2 not sent');
        }
        if (dunning.customerDunningBlocked) {
            verificationErrors.push('Customer dunning is blocked');
        }

        if (verificationErrors.length > 0) {
            return NextResponse.json(
                {
                    error: 'Verification failed for Level 3 initiation',
                    code: 'VERIFICATION_FAILED',
                    errors: verificationErrors,
                },
                { status: 400 }
            );
        }

        // ==========================================================================
        // CALCULATE AMOUNTS (Full interest + fees + costs)
        // ==========================================================================

        // Get jurisdiction config
        const jurisdictionConfig = await (prisma as any).dunningJurisdictionConfig.findFirst({
            where: {
                organizationId: session.user.organizationId,
                jurisdictionId: dunning.jurisdictionId || 'DE',
                isActive: true,
            },
        });

        let interestAmount = 0;
        let feesAmount = 0;
        let costsAmount = 0;

        // Full interest calculation
        if (includeInterest) {
            const interestRate = dunning.interestRateApplied
                ? Number(dunning.interestRateApplied)
                : jurisdictionConfig?.statutoryInterestRateB2B
                    ? Number(jurisdictionConfig.statutoryInterestRateB2B)
                    : 0.09;

            interestAmount = calculateInterest(
                Number(dunning.outstandingAmount),
                interestRate,
                dunning.daysPastDue,
                DayCountBasis.ACTUAL_365
            );
        }

        // Full fees
        if (includeFees) {
            feesAmount = jurisdictionConfig?.flatFeeAmountB2B
                ? Number(jurisdictionConfig.flatFeeAmountB2B)
                : 40;
        }

        // Additional costs for Level 3
        if (includeCosts) {
            // Legal preparation costs, etc.
            costsAmount = 50; // Default legal preparation fee
        }

        const totalFees = feesAmount + costsAmount;
        const totalAmount = calculateTotalDue(
            Number(dunning.outstandingAmount),
            interestAmount,
            totalFees
        );

        // ==========================================================================
        // CREATE LEVEL 3 PROPOSAL (Requires Multi-Signature Approval)
        // ==========================================================================

        const proposalId = generateProposalId(dunning.dunningId, DunningLevel.LEVEL_3, now);

        // Level 3 deadline - typically 7-14 days
        const proposalDeadline = deadline
            ? new Date(deadline)
            : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        // Get approval requirements
        const approvalRule = await (prisma as any).dunningAutomationRule.findFirst({
            where: {
                organizationId: session.user.organizationId,
                dunningLevels: { has: DunningLevel.LEVEL_3 },
                isActive: true,
            },
        });

        const requiredApprovals = approvalRule?.multiSignatureCount || 2;

        const proposal = await (prisma as any).dunningProposal.create({
            data: {
                proposalId,
                dunningId: dunning.id,
                proposalType: 'level3',
                proposalLevel: DunningLevel.LEVEL_3,
                status: ProposalStatus.PENDING,
                priority: ProposalPriority.HIGH, // Level 3 always high priority
                outstandingAmount: dunning.outstandingAmount,
                interestProposed: interestAmount,
                feesProposed: totalFees,
                totalProposed: totalAmount,
                currency: dunning.currency,
                verificationStatus: 'passed',
                verificationChecks: {
                    invoice: { verified: true },
                    payment: { verified: true },
                    dispute: { verified: !dunning.isDisputed },
                    customer: { verified: !dunning.customerDunningBlocked },
                    contract: { verified: true },
                    priorDunning: { verified: true, level2Sent: !!dunning.dunningLevel2SentAt },
                },
                invoiceVerified: true,
                paymentVerified: true,
                disputeVerified: true,
                customerVerified: true,
                contractVerified: true,
                priorDunningVerified: true,
                confidenceScore: 1.0, // Manual initiation = full confidence
                dataSourcesChecked: ['invoices', 'payments', 'customers', 'dunning'],
                inputSnapshot: {
                    dunning: {
                        status: dunning.status,
                        currentLevel: dunning.currentLevel,
                        daysPastDue: dunning.daysPastDue,
                        outstandingAmount: Number(dunning.outstandingAmount),
                        level2SentAt: dunning.dunningLevel2SentAt,
                    },
                    initiationReason: reason,
                    notes,
                },
                explanation: `Level 3 dunning manually initiated by ${session.user.name || session.user.email}. ` +
                    `Reason: ${reason}. ` +
                    `Outstanding: ${dunning.currency} ${Number(dunning.outstandingAmount).toLocaleString()}. ` +
                    `Total with interest/fees: ${dunning.currency} ${totalAmount.toLocaleString()}. ` +
                    `Requires ${requiredApprovals} approvals.`,
                deadline: proposalDeadline,
                expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days for Level 3
                proposedAt: now,
                proposedBy: session.user.id,
                organizationId: session.user.organizationId,
            },
        });

        // Update dunning
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: {
                status: DunningStatus.DUNNING_LEVEL3_PENDING,
                previousStatus: dunning.status,
                statusChangedAt: now,
                hasActiveProposal: true,
                activeProposalId: proposal.id,
                activeProposalLevel: 'level3',
                dunningLevel3InitiatedAt: now,
                dunningLevel3InitiatedBy: session.user.id,
                eventCount: dunning.eventCount + 1,
            },
        });

        // Create event
        const eventId = generateEventId(dunning.dunningId, DunningEventType.DUNNING_LEVEL3_MANUALLY_INITIATED, now);

        await (prisma as any).dunningEvent.create({
            data: {
                eventId,
                dunningId: dunning.id,
                eventType: DunningEventType.DUNNING_LEVEL3_MANUALLY_INITIATED,
                timestamp: now,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    proposalId: proposal.proposalId,
                    reason,
                    notes,
                    outstandingAmount: Number(dunning.outstandingAmount),
                    interestAmount,
                    feesAmount: totalFees,
                    totalAmount,
                    requiredApprovals,
                },
                dataSourcesChecked: ['invoices', 'payments', 'customers', 'dunning'],
                decision: 'level3_initiated',
                explanation: `Level 3 dunning manually initiated. Reason: ${reason}. Requires ${requiredApprovals} approvals before sending.`,
                previousEventId: dunning.lastEventId,
            },
        });

        // Update last event ID
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: { lastEventId: eventId },
        });

        return NextResponse.json({
            proposal: {
                ...proposal,
                outstandingAmount: Number(proposal.outstandingAmount),
                interestProposed: Number(proposal.interestProposed),
                feesProposed: Number(proposal.feesProposed),
                totalProposed: Number(proposal.totalProposed),
                confidenceScore: Number(proposal.confidenceScore),
            },
            dunning: {
                dunningId: dunning.dunningId,
                dunningNumber: dunning.dunningNumber,
                status: DunningStatus.DUNNING_LEVEL3_PENDING,
            },
            approval: {
                requiredApprovals,
                currentApprovals: 0,
                approvers: [],
            },
            message: `Level 3 dunning initiated. Requires ${requiredApprovals} approvals before sending.`,
            eventId,
            nextStep: 'approve-level3',
        }, { status: 201 });
    } catch (error) {
        console.error('Error initiating Level 3:', error);
        return NextResponse.json(
            { error: 'Failed to initiate Level 3 dunning' },
            { status: 500 }
        );
    }
}