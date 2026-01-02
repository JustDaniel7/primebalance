// =============================================================================
// DUNNING API - Proposals List (TS Sections 8, 9, 19)
// src/app/api/dunning/proposals/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProposalStatus, ProposalPriority } from '@/types/dunning';

// =============================================================================
// GET - List Pending Proposals (TS Section 19.1)
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const skip = (page - 1) * limit;

        // Filters
        const status = searchParams.get('status') || ProposalStatus.PENDING;
        const proposalType = searchParams.get('proposalType');
        const proposalLevel = searchParams.get('proposalLevel');
        const priority = searchParams.get('priority');
        const customerId = searchParams.get('customerId');
        const minConfidence = searchParams.get('minConfidence');
        const maxConfidence = searchParams.get('maxConfidence');

        // Sorting
        const sortBy = searchParams.get('sortBy') || 'proposedAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Build where clause
        const where: any = {
            organizationId: session.user.organizationId,
        };

        if (status) where.status = status;
        if (proposalType) where.proposalType = proposalType;
        if (proposalLevel) where.proposalLevel = parseInt(proposalLevel);
        if (priority) where.priority = priority;
        if (minConfidence || maxConfidence) {
            where.confidenceScore = {};
            if (minConfidence) where.confidenceScore.gte = parseFloat(minConfidence);
            if (maxConfidence) where.confidenceScore.lte = parseFloat(maxConfidence);
        }

        // If filtering by customer, join through dunning
        if (customerId) {
            where.dunning = { customerId };
        }

        // Execute queries
        const [proposals, total] = await Promise.all([
            (prisma as any).dunningProposal.findMany({
                where,
                include: {
                    dunning: {
                        select: {
                            dunningId: true,
                            dunningNumber: true,
                            invoiceId: true,
                            customerId: true,
                            customerName: true,
                            daysPastDue: true,
                            currentLevel: true,
                            status: true,
                        },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                take: limit,
                skip,
            }),
            (prisma as any).dunningProposal.count({ where }),
        ]);

        // Get statistics
        const [byStatus, byLevel, byPriority] = await Promise.all([
            (prisma as any).dunningProposal.groupBy({
                by: ['status'],
                where: { organizationId: session.user.organizationId },
                _count: { id: true },
            }),
            (prisma as any).dunningProposal.groupBy({
                by: ['proposalLevel'],
                where: { organizationId: session.user.organizationId, status: ProposalStatus.PENDING },
                _count: { id: true },
                _sum: { totalProposed: true },
            }),
            (prisma as any).dunningProposal.groupBy({
                by: ['priority'],
                where: { organizationId: session.user.organizationId, status: ProposalStatus.PENDING },
                _count: { id: true },
            }),
        ]);

        // Format proposals
        const formattedProposals = proposals.map((p: any) => ({
            ...p,
            outstandingAmount: Number(p.outstandingAmount),
            interestProposed: Number(p.interestProposed),
            feesProposed: Number(p.feesProposed),
            totalProposed: Number(p.totalProposed),
            confidenceScore: Number(p.confidenceScore),
        }));

        return NextResponse.json({
            proposals: formattedProposals,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrevious: page > 1,
            },
            statistics: {
                pending: byStatus.find((s: any) => s.status === ProposalStatus.PENDING)?._count.id || 0,
                approved: byStatus.find((s: any) => s.status === ProposalStatus.APPROVED)?._count.id || 0,
                rejected: byStatus.find((s: any) => s.status === ProposalStatus.REJECTED)?._count.id || 0,
                sent: byStatus.find((s: any) => s.status === ProposalStatus.SENT)?._count.id || 0,
                byLevel: byLevel.reduce((acc: any, item: any) => {
                    acc[item.proposalLevel] = {
                        count: item._count.id,
                        totalAmount: Number(item._sum.totalProposed || 0),
                    };
                    return acc;
                }, {}),
                byPriority: {
                    high: byPriority.find((p: any) => p.priority === ProposalPriority.HIGH)?._count.id || 0,
                    normal: byPriority.find((p: any) => p.priority === ProposalPriority.NORMAL)?._count.id || 0,
                    low: byPriority.find((p: any) => p.priority === ProposalPriority.LOW)?._count.id || 0,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching proposals:', error);
        return NextResponse.json(
            { error: 'Failed to fetch proposals' },
            { status: 500 }
        );
    }
}