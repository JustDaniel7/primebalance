// =============================================================================
// DUNNING API - Bulk Approve Proposals (TS Section 9.7)
// IMPORTANT: Level 3 is NEVER included in bulk operations
// src/app/api/dunning/proposals/approve-bulk/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    DunningLevel,
    DunningEventType,
    ProposalStatus,
    generateEventId,
} from '@/types/dunning';

// =============================================================================
// POST - Bulk Approve Proposals (Level 1 & 2 ONLY - TS Section 9.7)
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { proposalIds, notes } = body;

        if (!proposalIds || !Array.isArray(proposalIds) || proposalIds.length === 0) {
            return NextResponse.json(
                { error: 'proposalIds array is required' },
                { status: 400 }
            );
        }

        // Limit bulk operations
        if (proposalIds.length > 100) {
            return NextResponse.json(
                { error: 'Maximum 100 proposals per bulk operation' },
                { status: 400 }
            );
        }

        // Fetch proposals
        const proposals = await (prisma as any).dunningProposal.findMany({
            where: {
                organizationId: session.user.organizationId,
                OR: proposalIds.map((id: string) => ({
                    OR: [{ id }, { proposalId: id }],
                })),
                status: ProposalStatus.PENDING,
            },
            include: {
                dunning: {
                    select: {
                        id: true,
                        dunningId: true,
                        dunningNumber: true,
                        interestAccrued: true,
                        feesAccrued: true,
                        outstandingAmount: true,
                        currency: true,
                        lastEventId: true,
                        eventCount: true,
                    },
                },
            },
        });

        if (proposals.length === 0) {
            return NextResponse.json(
                { error: 'No pending proposals found for the given IDs' },
                { status: 404 }
            );
        }

        const now = new Date();
        const results: any[] = [];
        const errors: any[] = [];

        for (const proposal of proposals) {
            // CRITICAL: Skip Level 3 - NO bulk operations for Level 3 (TS Section 9.7)
            if (proposal.proposalLevel >= DunningLevel.LEVEL_3) {
                errors.push({
                    proposalId: proposal.proposalId,
                    error: 'Level 3 cannot be bulk approved. Individual multi-signature approval required.',
                    code: 'LEVEL3_NO_BULK',
                });
                continue;
            }

            try {
                // Approve proposal
                await (prisma as any).dunningProposal.update({
                    where: { id: proposal.id },
                    data: {
                        status: ProposalStatus.APPROVED,
                        approvedAt: now,
                        approvedBy: session.user.id,
                    },
                });

                // Update dunning
                const finalInterest = Number(proposal.interestProposed);
                const finalFees = Number(proposal.feesProposed);

                await (prisma as any).dunning.update({
                    where: { id: proposal.dunning.id },
                    data: {
                        interestAccrued: Number(proposal.dunning.interestAccrued) + finalInterest,
                        feesAccrued: Number(proposal.dunning.feesAccrued) + finalFees,
                        totalDue: Number(proposal.dunning.outstandingAmount) +
                            Number(proposal.dunning.interestAccrued) + finalInterest +
                            Number(proposal.dunning.feesAccrued) + finalFees,
                        eventCount: proposal.dunning.eventCount + 1,
                    },
                });

                // Create event
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

                const eventId = generateEventId(proposal.dunning.dunningId, eventType, now);

                await (prisma as any).dunningEvent.create({
                    data: {
                        eventId,
                        dunningId: proposal.dunning.id,
                        eventType,
                        timestamp: now,
                        actorId: session.user.id,
                        actorName: session.user.name || session.user.email,
                        actorType: 'user',
                        payload: {
                            proposalId: proposal.proposalId,
                            proposalLevel: proposal.proposalLevel,
                            bulkOperation: true,
                            notes,
                        },
                        explanation: `Proposal ${proposal.proposalId} bulk approved`,
                        previousEventId: proposal.dunning.lastEventId,
                    },
                });

                // Update last event ID
                await (prisma as any).dunning.update({
                    where: { id: proposal.dunning.id },
                    data: { lastEventId: eventId },
                });

                results.push({
                    proposalId: proposal.proposalId,
                    dunningId: proposal.dunning.dunningId,
                    dunningNumber: proposal.dunning.dunningNumber,
                    level: proposal.proposalLevel,
                    status: 'approved',
                });
            } catch (err: any) {
                errors.push({
                    proposalId: proposal.proposalId,
                    error: err.message,
                });
            }
        }

        return NextResponse.json({
            approved: results.length,
            failed: errors.length,
            total: proposalIds.length,
            results,
            errors: errors.length > 0 ? errors : undefined,
            message: `Bulk approved ${results.length}/${proposalIds.length} proposals. ${errors.length > 0 ? `${errors.length} failed.` : ''}`,
        });
    } catch (error) {
        console.error('Error bulk approving proposals:', error);
        return NextResponse.json(
            { error: 'Failed to bulk approve proposals' },
            { status: 500 }
        );
    }
}