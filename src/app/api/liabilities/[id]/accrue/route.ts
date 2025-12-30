// =============================================================================
// LIABILITIES API - Interest Accrual (TS Section 8)
// src/app/api/liabilities/[id]/accrue/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    LiabilityEventType,
    AccrualType,
    DayCountBasis,
    calculateInterest,
    calculateTotalOutstanding,
} from '@/types/liabilities';

// =============================================================================
// POST - Accrue Interest
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
            periodStart,
            periodEnd,
            amount: providedAmount,
            rate: providedRate,
            explanation,
        } = body;

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

        // Check if interest-bearing
        if (!liability.isInterestBearing) {
            return NextResponse.json(
                {
                    error: 'Liability is not interest-bearing',
                    code: 'NOT_INTEREST_BEARING',
                },
                { status: 400 }
            );
        }

        const now = new Date();

        // Determine period
        const start = periodStart
            ? new Date(periodStart)
            : (liability.lastInterestAccrual || liability.interestAccrualStart || liability.inceptionDate);
        const end = periodEnd ? new Date(periodEnd) : now;

        if (end <= start) {
            return NextResponse.json(
                { error: 'Period end must be after period start' },
                { status: 400 }
            );
        }

        // Calculate days in period
        const dayCount = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        if (dayCount <= 0) {
            return NextResponse.json(
                { error: 'Accrual period must be at least 1 day' },
                { status: 400 }
            );
        }

        // Get interest rate
        const rate = providedRate ?? Number(liability.interestRate);
        if (!rate || rate <= 0) {
            return NextResponse.json(
                { error: 'Interest rate is required' },
                { status: 400 }
            );
        }

        // Get principal base
        const principalBase = Number(liability.outstandingPrincipal);

        // Calculate interest amount
        const dayCountBasis = (liability.interestDayCount as DayCountBasis) || DayCountBasis.ACTUAL_360;
        const calculatedAmount = providedAmount ?? calculateInterest(principalBase, rate, dayCount, dayCountBasis);

        // Generate accrual ID
        const accrualId = `ACC-${liability.liabilityId}-${now.getTime()}`;

        // Create accrual record
        const accrual = await (prisma as any).liabilityAccrual.create({
            data: {
                liabilityId: liability.id,
                accrualId,
                accrualType: AccrualType.INTEREST,
                periodStart: start,
                periodEnd: end,
                principalBase,
                rate,
                dayCount,
                dayCountBasis,
                amount: calculatedAmount,
                currency: liability.currency,
                status: 'posted',
                postedAt: now,
                postedBy: session.user.id,
                explanation: explanation || `Interest accrual for ${dayCount} days at ${(rate * 100).toFixed(2)}% annual rate`,
                calculationDetails: {
                    principalBase,
                    annualRate: rate,
                    dayCount,
                    dayCountBasis,
                    formula: `${principalBase} × ${rate} × ${dayCount} / ${dayCountBasis === DayCountBasis.ACTUAL_365 ? 365 : 360}`,
                },
            },
        });

        // Update liability
        const newAccruedInterest = Number(liability.accruedInterest) + calculatedAmount;
        const newTotalOutstanding = calculateTotalOutstanding(
            Number(liability.outstandingPrincipal),
            newAccruedInterest,
            Number(liability.feesPenalties)
        );

        const updated = await (prisma as any).liability.update({
            where: { id: liability.id },
            data: {
                accruedInterest: newAccruedInterest,
                totalOutstanding: newTotalOutstanding,
                expectedCashImpact: newTotalOutstanding,
                lastInterestAccrual: end,
                nextInterestAccrual: calculateNextAccrualDate(end, liability.interestCompounding),
                version: liability.version + 1,
                eventCount: liability.eventCount + 1,
            },
        });

        // Create event
        const eventId = `evt_${liability.liabilityId}_interest_accrued_${now.getTime()}`;

        await (prisma as any).liabilityEvent.create({
            data: {
                eventId,
                liabilityId: liability.id,
                eventType: LiabilityEventType.INTEREST_ACCRUED,
                timestamp: now,
                effectiveDate: end,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    accrualId,
                    periodStart: start.toISOString(),
                    periodEnd: end.toISOString(),
                    principalBase,
                    rate,
                    dayCount,
                    dayCountBasis,
                    amount: calculatedAmount,
                    newAccruedInterest,
                    newTotalOutstanding,
                },
                previousState: {
                    accruedInterest: Number(liability.accruedInterest),
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
                principalBase: Number(accrual.principalBase),
                rate: Number(accrual.rate),
                amount: Number(accrual.amount),
            },
            liability: {
                id: updated.id,
                liabilityId: updated.liabilityId,
                accruedInterest: Number(updated.accruedInterest),
                totalOutstanding: Number(updated.totalOutstanding),
                lastInterestAccrual: updated.lastInterestAccrual,
                nextInterestAccrual: updated.nextInterestAccrual,
            },
            message: `Interest of ${liability.currency} ${calculatedAmount.toLocaleString()} accrued for ${dayCount} days`,
            eventId,
        }, { status: 201 });
    } catch (error) {
        console.error('Error accruing interest:', error);
        return NextResponse.json(
            { error: 'Failed to accrue interest' },
            { status: 500 }
        );
    }
}

// Helper function to calculate next accrual date
function calculateNextAccrualDate(currentEnd: Date, compounding?: string): Date {
    const next = new Date(currentEnd);
    switch (compounding) {
        case 'monthly':
            next.setMonth(next.getMonth() + 1);
            break;
        case 'quarterly':
            next.setMonth(next.getMonth() + 3);
            break;
        case 'annually':
            next.setFullYear(next.getFullYear() + 1);
            break;
        default:
            next.setMonth(next.getMonth() + 1); // Default to monthly
    }
    return next;
}