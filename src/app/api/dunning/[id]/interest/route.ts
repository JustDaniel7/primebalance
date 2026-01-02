// =============================================================================
// DUNNING API - Interest Calculation (TS Section 11)
// src/app/api/dunning/[id]/interest/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    DunningStatus,
    DunningEventType,
    InterestRateSource,
    DayCountBasis,
    generateEventId,
    calculateInterest,
} from '@/types/dunning';

// =============================================================================
// GET - Get Interest Accruals
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

        // Get accruals
        const accruals = await (prisma as any).dunningInterestAccrual.findMany({
            where: { dunningId: dunning.id },
            orderBy: { periodEnd: 'desc' },
        });

        const total = accruals.reduce((sum: number, a: any) => sum + Number(a.amount), 0);

        return NextResponse.json({
            dunningId: dunning.dunningId,
            dunningNumber: dunning.dunningNumber,
            accruals: accruals.map((a: any) => ({
                ...a,
                principalBase: Number(a.principalBase),
                interestRate: Number(a.interestRate),
                amount: Number(a.amount),
                amountInReporting: a.amountInReporting ? Number(a.amountInReporting) : null,
                fxRate: a.fxRate ? Number(a.fxRate) : null,
                statutoryRate: a.statutoryRate ? Number(a.statutoryRate) : null,
            })),
            summary: {
                totalAccruals: accruals.length,
                totalAmount: total,
            },
        });
    } catch (error) {
        console.error('Error fetching interest accruals:', error);
        return NextResponse.json(
            { error: 'Failed to fetch interest accruals' },
            { status: 500 }
        );
    }
}

// =============================================================================
// POST - Calculate/Apply Interest (TS Section 11)
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
            rate,
            rateSource = InterestRateSource.STATUTORY,
            dayCountBasis = DayCountBasis.ACTUAL_365,
            apply = false, // If true, apply to dunning
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

        // Cannot calculate interest for settled/written-off
        if ([DunningStatus.SETTLED, DunningStatus.WRITTEN_OFF].includes(dunning.status)) {
            return NextResponse.json(
                {
                    error: `Cannot calculate interest for dunning in status '${dunning.status}'`,
                    code: 'INVALID_STATUS',
                },
                { status: 400 }
            );
        }

        const now = new Date();

        // Determine period
        const calcPeriodStart = periodStart
            ? new Date(periodStart)
            : dunning.interestLastCalculated || dunning.invoiceDueDate;
        const calcPeriodEnd = periodEnd ? new Date(periodEnd) : now;

        // Calculate days in period
        const daysInPeriod = Math.floor(
            (calcPeriodEnd.getTime() - new Date(calcPeriodStart).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysInPeriod <= 0) {
            return NextResponse.json(
                { error: 'Period end must be after period start' },
                { status: 400 }
            );
        }

        // Get interest rate
        let interestRate = rate;
        let statutoryRate = null;

        if (!interestRate) {
            // Get from jurisdiction config
            const jurisdictionConfig = await (prisma as any).dunningJurisdictionConfig.findFirst({
                where: {
                    organizationId: session.user.organizationId,
                    jurisdictionId: dunning.jurisdictionId || 'DE',
                    isActive: true,
                },
            });

            if (jurisdictionConfig) {
                interestRate = dunning.customerType === 'consumer'
                    ? Number(jurisdictionConfig.statutoryInterestRateB2C || 0.05)
                    : Number(jurisdictionConfig.statutoryInterestRateB2B || 0.09);
                statutoryRate = interestRate;
            } else {
                interestRate = 0.09; // Default B2B rate
            }
        }

        // Calculate interest
        const principalBase = Number(dunning.outstandingAmount);
        const interestAmount = calculateInterest(
            principalBase,
            interestRate,
            daysInPeriod,
            dayCountBasis as DayCountBasis
        );

        const result = {
            periodStart: calcPeriodStart,
            periodEnd: calcPeriodEnd,
            daysInPeriod,
            principalBase,
            interestRate,
            rateSource,
            dayCountBasis,
            amount: Math.round(interestAmount * 100) / 100,
            currency: dunning.currency,
            statutoryRate,
            calculationDetails: {
                formula: `${principalBase} × ${interestRate} × ${daysInPeriod} / ${dayCountBasis === DayCountBasis.ACTUAL_360 ? 360 : 365}`,
                result: interestAmount,
            },
        };

        // If apply, create accrual record and update dunning
        if (apply) {
            const accrualId = `INT-${dunning.dunningId}-${now.getTime()}`;

            const accrual = await (prisma as any).dunningInterestAccrual.create({
                data: {
                    accrualId,
                    dunningId: dunning.id,
                    periodStart: calcPeriodStart,
                    periodEnd: calcPeriodEnd,
                    daysInPeriod,
                    principalBase,
                    interestRate,
                    rateSource,
                    dayCountBasis,
                    amount: result.amount,
                    currency: dunning.currency,
                    jurisdictionId: dunning.jurisdictionId,
                    statutoryRate,
                    status: 'applied',
                    appliedAt: now,
                    appliedBy: session.user.id,
                    calculationDetails: result.calculationDetails,
                    explanation: `Interest calculated: ${dunning.currency} ${result.amount.toLocaleString()} for ${daysInPeriod} days at ${(interestRate * 100).toFixed(2)}%`,
                    createdAt: now,
                    createdBy: session.user.id,
                },
            });

            // Update dunning
            const newInterestAccrued = Number(dunning.interestAccrued) + result.amount;
            const newTotalDue = Number(dunning.outstandingAmount) + newInterestAccrued + Number(dunning.feesAccrued);

            await (prisma as any).dunning.update({
                where: { id: dunning.id },
                data: {
                    interestAccrued: newInterestAccrued,
                    totalDue: newTotalDue,
                    interestRateApplied: interestRate,
                    interestRateSource: rateSource,
                    interestLastCalculated: calcPeriodEnd,
                    interestDayCount: dayCountBasis,
                    eventCount: dunning.eventCount + 1,
                },
            });

            // Create event
            const eventId = generateEventId(dunning.dunningId, DunningEventType.INTEREST_ACCRUED, now);

            await (prisma as any).dunningEvent.create({
                data: {
                    eventId,
                    dunningId: dunning.id,
                    eventType: DunningEventType.INTEREST_ACCRUED,
                    timestamp: now,
                    actorId: session.user.id,
                    actorName: session.user.name || session.user.email,
                    actorType: 'user',
                    payload: result,
                    explanation: `Interest accrued: ${dunning.currency} ${result.amount.toLocaleString()}`,
                    previousEventId: dunning.lastEventId,
                },
            });

            // Update last event ID
            await (prisma as any).dunning.update({
                where: { id: dunning.id },
                data: { lastEventId: eventId },
            });

            return NextResponse.json({
                calculation: result,
                accrual: {
                    ...accrual,
                    principalBase: Number(accrual.principalBase),
                    interestRate: Number(accrual.interestRate),
                    amount: Number(accrual.amount),
                },
                dunning: {
                    dunningId: dunning.dunningId,
                    interestAccrued: newInterestAccrued,
                    totalDue: newTotalDue,
                },
                message: `Interest of ${dunning.currency} ${result.amount.toLocaleString()} applied`,
                eventId,
            });
        }

        // Just return calculation without applying
        return NextResponse.json({
            calculation: result,
            applied: false,
            message: 'Interest calculated but not applied. Set apply=true to apply.',
        });
    } catch (error) {
        console.error('Error calculating interest:', error);
        return NextResponse.json(
            { error: 'Failed to calculate interest' },
            { status: 500 }
        );
    }
}