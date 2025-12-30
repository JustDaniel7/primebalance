// =============================================================================
// LIABILITIES API - Fee Application (TS Section 8.2)
// src/app/api/liabilities/[id]/fees/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    LiabilityEventType,
    AccrualType,
    calculateTotalOutstanding,
} from '@/types/liabilities';

// =============================================================================
// GET - List Fees/Accruals for Liability
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
        const { searchParams } = new URL(request.url);
        const accrualType = searchParams.get('type');

        // Find liability
        const liability = await (prisma as any).liability.findFirst({
            where: {
                organizationId: session.user.organizationId,
                OR: [
                    { id },
                    { liabilityId: id },
                ],
            },
            select: { id: true, liabilityId: true },
        });

        if (!liability) {
            return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
        }

        // Build where clause
        const where: any = { liabilityId: liability.id };
        if (accrualType) where.accrualType = accrualType;

        // Get accruals
        const accruals = await (prisma as any).liabilityAccrual.findMany({
            where,
            orderBy: { periodEnd: 'desc' },
        });

        // Get summary by type
        const summary = await (prisma as any).liabilityAccrual.groupBy({
            by: ['accrualType'],
            where: { liabilityId: liability.id, isReversed: false },
            _sum: { amount: true },
            _count: { id: true },
        });

        // Format accruals
        const formattedAccruals = accruals.map((a: any) => ({
            ...a,
            principalBase: Number(a.principalBase),
            rate: a.rate ? Number(a.rate) : null,
            amount: Number(a.amount),
        }));

        return NextResponse.json({
            liabilityId: liability.liabilityId,
            accruals: formattedAccruals,
            summary: {
                total: accruals.length,
                byType: summary.reduce((acc: any, item: any) => {
                    acc[item.accrualType] = {
                        count: item._count.id,
                        totalAmount: Number(item._sum.amount || 0),
                    };
                    return acc;
                }, {}),
            },
        });
    } catch (error) {
        console.error('Error fetching fees:', error);
        return NextResponse.json(
            { error: 'Failed to fetch fees' },
            { status: 500 }
        );
    }
}

// =============================================================================
// POST - Apply Fee
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
            feeType,
            amount,
            description,
            effectiveDate,
        } = body;

        // Validate
        if (!feeType) {
            return NextResponse.json({ error: 'Fee type is required' }, { status: 400 });
        }
        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Fee amount must be greater than 0' }, { status: 400 });
        }

        // Valid fee types
        const validFeeTypes = [
            AccrualType.COMMITMENT_FEE,
            AccrualType.ORIGINATION_FEE,
            AccrualType.PENALTY,
            AccrualType.LEGAL_FEE,
            AccrualType.OTHER_FEE,
        ];
        if (!validFeeTypes.includes(feeType)) {
            return NextResponse.json(
                { error: `Invalid fee type. Must be one of: ${validFeeTypes.join(', ')}` },
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

        const now = new Date();
        const effDate = effectiveDate ? new Date(effectiveDate) : now;

        // Generate accrual ID
        const accrualId = `FEE-${liability.liabilityId}-${now.getTime()}`;

        // Create accrual record
        const accrual = await (prisma as any).liabilityAccrual.create({
            data: {
                liabilityId: liability.id,
                accrualId,
                accrualType: feeType,
                periodStart: effDate,
                periodEnd: effDate,
                principalBase: Number(liability.outstandingPrincipal),
                amount,
                currency: liability.currency,
                status: 'posted',
                postedAt: now,
                postedBy: session.user.id,
                explanation: description || `${feeType} applied`,
            },
        });

        // Update liability fee balances
        let updateField = 'otherFeesAccrued';
        if (feeType === AccrualType.PENALTY) updateField = 'penaltiesAccrued';
        else if (feeType === AccrualType.LEGAL_FEE) updateField = 'legalFeesAccrued';
        else if (feeType === AccrualType.COMMITMENT_FEE) updateField = 'commitmentFee';
        else if (feeType === AccrualType.ORIGINATION_FEE) updateField = 'originationFee';

        const newFeesPenalties = Number(liability.feesPenalties) + amount;
        const newTotalOutstanding = calculateTotalOutstanding(
            Number(liability.outstandingPrincipal),
            Number(liability.accruedInterest),
            newFeesPenalties
        );

        const updateData: any = {
            feesPenalties: newFeesPenalties,
            totalOutstanding: newTotalOutstanding,
            expectedCashImpact: newTotalOutstanding,
            version: liability.version + 1,
            eventCount: liability.eventCount + 1,
        };

        // Also update specific fee field
        if (['penaltiesAccrued', 'legalFeesAccrued', 'otherFeesAccrued'].includes(updateField)) {
            updateData[updateField] = Number(liability[updateField] || 0) + amount;
        }

        const updated = await (prisma as any).liability.update({
            where: { id: liability.id },
            data: updateData,
        });

        // Create event
        const eventId = `evt_${liability.liabilityId}_fee_applied_${now.getTime()}`;

        await (prisma as any).liabilityEvent.create({
            data: {
                eventId,
                liabilityId: liability.id,
                eventType: LiabilityEventType.FEE_APPLIED,
                timestamp: now,
                effectiveDate: effDate,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    accrualId,
                    feeType,
                    amount,
                    description,
                    newFeesPenalties,
                    newTotalOutstanding,
                },
                previousState: {
                    feesPenalties: Number(liability.feesPenalties),
                    totalOutstanding: Number(liability.totalOutstanding),
                },
                previousEventId: liability.lastEventId,
                explanation: accrual.explanation,
            },
        });

        // Update last event ID
        await (prisma as any).liability.update({
            where: { id: liability.id },
            data: { lastEventId: eventId },
        });

        return NextResponse.json({
            accrual: {
                ...accrual,
                amount: Number(accrual.amount),
            },
            liability: {
                id: updated.id,
                liabilityId: updated.liabilityId,
                feesPenalties: Number(updated.feesPenalties),
                totalOutstanding: Number(updated.totalOutstanding),
            },
            message: `Fee of ${liability.currency} ${amount.toLocaleString()} applied`,
            eventId,
        }, { status: 201 });
    } catch (error) {
        console.error('Error applying fee:', error);
        return NextResponse.json(
            { error: 'Failed to apply fee' },
            { status: 500 }
        );
    }
}