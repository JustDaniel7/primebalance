// =============================================================================
// LIABILITIES API - Settlement (TS Sections 5, 6, 19)
// src/app/api/liabilities/[id]/settle/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import {
    LiabilityStatus,
    LiabilityEventType,
    SettlementType,
    isLiabilitySettleable,
    calculateTotalOutstanding,
} from '@/types/liabilities';

// =============================================================================
// POST - Record Settlement (Partial or Full)
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
            amount,
            settlementType = 'partial',
            settlementDate,
            principalAmount,
            interestAmount = 0,
            feesAmount = 0,
            penaltiesWaived = 0,
            paymentId,
            reference,
            notes,
            fxRate,
            isOffset = false,
            offsetReceivableId,
            nettingBatchId,
        } = body;

        // Validate amount
        if (amount === undefined || amount === null || amount <= 0) {
            return NextResponse.json(
                { error: 'Settlement amount must be greater than 0' },
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

        // Validate settleable status
        if (!isLiabilitySettleable(liability.status)) {
            return NextResponse.json(
                {
                    error: `Cannot settle liability in status '${liability.status}'`,
                    code: 'LIABILITY_NOT_SETTLEABLE',
                    currentStatus: liability.status,
                },
                { status: 400 }
            );
        }

        // Validate settlement amount doesn't exceed outstanding (TS Section 19)
        const totalOutstanding = Number(liability.totalOutstanding);
        if (amount > totalOutstanding) {
            return NextResponse.json(
                {
                    error: 'Settlement amount cannot exceed outstanding amount',
                    code: 'OVERPAYMENT_PREVENTED',
                    amount,
                    totalOutstanding,
                },
                { status: 400 }
            );
        }

        const now = new Date();
        const settleDate = settlementDate ? new Date(settlementDate) : now;

        // Calculate principal portion (if not provided, assume all goes to principal)
        const actualPrincipalAmount = principalAmount ?? (amount - interestAmount - feesAmount);

        // Validate breakdown
        const breakdownTotal = actualPrincipalAmount + interestAmount + feesAmount;
        if (Math.abs(breakdownTotal - amount) > 0.01) {
            return NextResponse.json(
                {
                    error: 'Settlement breakdown must equal total amount',
                    amount,
                    breakdownTotal,
                },
                { status: 400 }
            );
        }

        // Calculate new balances
        const outstandingBefore = Number(liability.outstandingPrincipal);
        const interestBefore = Number(liability.accruedInterest);
        const feesBefore = Number(liability.feesPenalties);

        const newOutstandingPrincipal = Math.max(0, outstandingBefore - actualPrincipalAmount);
        const newAccruedInterest = Math.max(0, interestBefore - interestAmount);
        const newFeesPenalties = Math.max(0, feesBefore - feesAmount - penaltiesWaived);
        const newTotalOutstanding = calculateTotalOutstanding(
            newOutstandingPrincipal,
            newAccruedInterest,
            newFeesPenalties
        );
        const newTotalSettled = Number(liability.totalSettled) + amount;

        // Determine new status
        let newStatus = liability.status;
        let actualSettlementType = settlementType;

        if (newTotalOutstanding <= 0.01) {
            // Fully settled
            newStatus = LiabilityStatus.FULLY_SETTLED;
            actualSettlementType = SettlementType.FULL;
        } else if (liability.status === LiabilityStatus.ACTIVE) {
            // Partially settled
            newStatus = LiabilityStatus.PARTIALLY_SETTLED;
            actualSettlementType = SettlementType.PARTIAL;
        }

        // Calculate FX gain/loss if applicable
        let fxGainLoss = 0;
        if (fxRate && liability.fxRateAtRecognition) {
            const recognitionRate = Number(liability.fxRateAtRecognition);
            fxGainLoss = amount * (recognitionRate - fxRate);
        }

        // Update credit line values if applicable
        let availableCredit = liability.availableCredit;
        let utilizationRate = liability.utilizationRate;
        if (liability.creditLimit) {
            const limit = Number(liability.creditLimit);
            availableCredit = limit - newOutstandingPrincipal;
            utilizationRate = (newOutstandingPrincipal / limit) * 100;
        }

        // Generate settlement ID
        const settlementId = `SET-${liability.liabilityId}-${now.getTime()}`;

        // Create settlement record
        const settlement = await (prisma as any).liabilitySettlement.create({
            data: {
                liabilityId: liability.id,
                settlementId,
                settlementType: actualSettlementType,
                amount,
                principalSettled: actualPrincipalAmount,
                interestSettled: interestAmount,
                feesSettled: feesAmount,
                penaltiesWaived,
                currency: liability.currency,
                fxRate,
                fxGainLoss,
                outstandingBefore: totalOutstanding,
                outstandingAfter: newTotalOutstanding,
                settlementDate: settleDate,
                effectiveDate: settleDate,
                settledBy: session.user.id,
                paymentId,
                reference,
                notes,
                isOffset,
                offsetReceivableId,
                nettingBatchId,
            },
        });

        // Update liability
        const updated = await (prisma as any).liability.update({
            where: { id: liability.id },
            data: {
                status: newStatus,
                previousStatus: liability.status,
                statusChangedAt: newStatus !== liability.status ? now : undefined,
                statusChangedBy: newStatus !== liability.status ? session.user.id : undefined,
                outstandingPrincipal: newOutstandingPrincipal,
                accruedInterest: newAccruedInterest,
                feesPenalties: newFeesPenalties,
                totalOutstanding: newTotalOutstanding,
                totalSettled: newTotalSettled,
                lastPaymentDate: settleDate,
                settledDate: newStatus === LiabilityStatus.FULLY_SETTLED ? settleDate : null,
                fxRateAtSettlement: newStatus === LiabilityStatus.FULLY_SETTLED ? fxRate : null,
                unrealizedFxGainLoss: Number(liability.unrealizedFxGainLoss) + fxGainLoss,
                availableCredit,
                utilizationRate,
                paymentsCompleted: liability.paymentsCompleted + 1,
                expectedCashImpact: newTotalOutstanding,
                version: liability.version + 1,
                eventCount: liability.eventCount + 1,
            },
        });

        // Create event
        const eventType = newStatus === LiabilityStatus.FULLY_SETTLED
            ? LiabilityEventType.LIABILITY_FULLY_SETTLED
            : LiabilityEventType.LIABILITY_PARTIALLY_SETTLED;

        const eventId = `evt_${liability.liabilityId}_settled_${now.getTime()}`;

        await (prisma as any).liabilityEvent.create({
            data: {
                eventId,
                liabilityId: liability.id,
                eventType,
                timestamp: now,
                effectiveDate: settleDate,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    settlementId,
                    settlementType: actualSettlementType,
                    amount,
                    principalSettled: actualPrincipalAmount,
                    interestSettled: interestAmount,
                    feesSettled: feesAmount,
                    penaltiesWaived,
                    outstandingBefore: totalOutstanding,
                    outstandingAfter: newTotalOutstanding,
                    fxGainLoss,
                    isOffset,
                    status: newStatus,
                },
                previousState: {
                    status: liability.status,
                    outstandingPrincipal: outstandingBefore,
                    accruedInterest: interestBefore,
                    feesPenalties: feesBefore,
                    totalOutstanding,
                },
                previousEventId: liability.lastEventId,
                explanation: `Settlement of ${liability.currency} ${amount.toLocaleString()} recorded. ${newStatus === LiabilityStatus.FULLY_SETTLED ? 'Liability fully settled.' : `Remaining: ${liability.currency} ${newTotalOutstanding.toLocaleString()}`}`,
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
                accruedInterest: Number(updated.accruedInterest),
                feesPenalties: Number(updated.feesPenalties),
                totalOutstanding: Number(updated.totalOutstanding),
                totalSettled: Number(updated.totalSettled),
            },
            settlement: {
                ...settlement,
                amount: Number(settlement.amount),
                principalSettled: Number(settlement.principalSettled),
                interestSettled: Number(settlement.interestSettled),
                feesSettled: Number(settlement.feesSettled),
                outstandingBefore: Number(settlement.outstandingBefore),
                outstandingAfter: Number(settlement.outstandingAfter),
                fxGainLoss: Number(settlement.fxGainLoss),
            },
            message: newStatus === LiabilityStatus.FULLY_SETTLED
                ? `Liability ${liability.liabilityId} fully settled`
                : `Settlement of ${liability.currency} ${amount.toLocaleString()} recorded`,
            eventId,
        }, { status: 201 });
    } catch (error) {
        console.error('Error settling liability:', error);
        return NextResponse.json(
            { error: 'Failed to settle liability' },
            { status: 500 }
        );
    }
}