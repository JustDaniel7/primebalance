// =============================================================================
// DUNNING API - Fee Management (TS Section 11)
// src/app/api/dunning/[id]/fees/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    DunningStatus,
    DunningEventType,
    FeeType,
    FeeSource,
    FeeStatus,
    generateEventId,
} from '@/types/dunning';

// =============================================================================
// GET - Get Fees
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

        // Get fees
        const fees = await (prisma as any).dunningFee.findMany({
            where: { dunningId: dunning.id },
            orderBy: { createdAt: 'desc' },
        });

        const total = fees
            .filter((f: any) => f.status === FeeStatus.APPLIED)
            .reduce((sum: number, f: any) => sum + Number(f.amount), 0);

        return NextResponse.json({
            dunningId: dunning.dunningId,
            dunningNumber: dunning.dunningNumber,
            fees: fees.map((f: any) => ({
                ...f,
                amount: Number(f.amount),
                amountInReporting: f.amountInReporting ? Number(f.amountInReporting) : null,
                fxRate: f.fxRate ? Number(f.fxRate) : null,
                baseAmount: f.baseAmount ? Number(f.baseAmount) : null,
                percentage: f.percentage ? Number(f.percentage) : null,
                jurisdictionLimit: f.jurisdictionLimit ? Number(f.jurisdictionLimit) : null,
            })),
            summary: {
                totalFees: fees.length,
                totalAmount: total,
                byType: fees.reduce((acc: any, f: any) => {
                    const type = f.feeType;
                    if (!acc[type]) acc[type] = { count: 0, amount: 0 };
                    acc[type].count++;
                    if (f.status === FeeStatus.APPLIED) acc[type].amount += Number(f.amount);
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
// POST - Apply Fee (TS Section 11)
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
            dunningLevel,
            feeSource = FeeSource.CUSTOM,
        } = body;

        if (!feeType) {
            return NextResponse.json({ error: 'Fee type is required' }, { status: 400 });
        }
        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Fee amount must be greater than 0' }, { status: 400 });
        }

        const validFeeTypes = Object.values(FeeType);
        if (!validFeeTypes.includes(feeType)) {
            return NextResponse.json(
                { error: 'Invalid fee type', validTypes: validFeeTypes },
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

        // Cannot apply fee to settled/written-off
        if ([DunningStatus.SETTLED, DunningStatus.WRITTEN_OFF].includes(dunning.status)) {
            return NextResponse.json(
                {
                    error: `Cannot apply fee to dunning in status '${dunning.status}'`,
                    code: 'INVALID_STATUS',
                },
                { status: 400 }
            );
        }

        const now = new Date();

        // Check jurisdiction limits
        let jurisdictionLimit = null;
        const jurisdictionConfig = await (prisma as any).dunningJurisdictionConfig.findFirst({
            where: {
                organizationId: session.user.organizationId,
                jurisdictionId: dunning.jurisdictionId || 'DE',
                isActive: true,
            },
        });

        if (jurisdictionConfig?.maxFeePercentage) {
            jurisdictionLimit = Number(dunning.outstandingAmount) * Number(jurisdictionConfig.maxFeePercentage);
            if (amount > jurisdictionLimit) {
                return NextResponse.json(
                    {
                        error: `Fee exceeds jurisdiction limit of ${dunning.currency} ${jurisdictionLimit.toLocaleString()}`,
                        code: 'EXCEEDS_JURISDICTION_LIMIT',
                        limit: jurisdictionLimit,
                    },
                    { status: 400 }
                );
            }
        }

        // Create fee
        const feeId = `FEE-${dunning.dunningId}-${feeType}-${now.getTime()}`;

        const fee = await (prisma as any).dunningFee.create({
            data: {
                feeId,
                dunningId: dunning.id,
                feeType,
                feeSource,
                description: description || `${feeType} fee`,
                amount,
                currency: dunning.currency,
                jurisdictionId: dunning.jurisdictionId,
                jurisdictionLimit,
                dunningLevel: dunningLevel || dunning.currentLevel,
                status: FeeStatus.APPLIED,
                appliedAt: now,
                appliedBy: session.user.id,
                explanation: `Fee applied: ${feeType} - ${dunning.currency} ${amount.toLocaleString()}`,
                createdAt: now,
                createdBy: session.user.id,
            },
        });

        // Update dunning
        const newFeesAccrued = Number(dunning.feesAccrued) + amount;
        const newTotalDue = Number(dunning.outstandingAmount) + Number(dunning.interestAccrued) + newFeesAccrued;

        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: {
                feesAccrued: newFeesAccrued,
                totalDue: newTotalDue,
                eventCount: dunning.eventCount + 1,
            },
        });

        // Create event
        const eventId = generateEventId(dunning.dunningId, DunningEventType.FEE_APPLIED, now);

        await (prisma as any).dunningEvent.create({
            data: {
                eventId,
                dunningId: dunning.id,
                eventType: DunningEventType.FEE_APPLIED,
                timestamp: now,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    feeId,
                    feeType,
                    amount,
                    description,
                    dunningLevel: dunningLevel || dunning.currentLevel,
                },
                explanation: `Fee applied: ${feeType} - ${dunning.currency} ${amount.toLocaleString()}`,
                previousEventId: dunning.lastEventId,
            },
        });

        // Update last event ID
        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: { lastEventId: eventId },
        });

        return NextResponse.json({
            fee: {
                ...fee,
                amount: Number(fee.amount),
                jurisdictionLimit: fee.jurisdictionLimit ? Number(fee.jurisdictionLimit) : null,
            },
            dunning: {
                dunningId: dunning.dunningId,
                feesAccrued: newFeesAccrued,
                totalDue: newTotalDue,
            },
            message: `Fee of ${dunning.currency} ${amount.toLocaleString()} applied`,
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