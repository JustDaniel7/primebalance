// =============================================================================
// LIABILITIES API - FX Revaluation (TS Section 9)
// src/app/api/liabilities/[id]/fx-revalue/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LiabilityEventType } from '@/types/liabilities';

// =============================================================================
// POST - Perform FX Revaluation
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
            newFxRate,
            fxSource = 'manual',
            effectiveDate,
            notes,
        } = body;

        // Validate
        if (!newFxRate || newFxRate <= 0) {
            return NextResponse.json(
                { error: 'Valid FX rate is required' },
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

        // Check if foreign currency
        const reportingCurrency = liability.reportingCurrency || 'EUR';
        if (liability.currency === reportingCurrency) {
            return NextResponse.json(
                {
                    error: 'FX revaluation not applicable - liability is in reporting currency',
                    code: 'SAME_CURRENCY',
                },
                { status: 400 }
            );
        }

        const now = new Date();
        const effDate = effectiveDate ? new Date(effectiveDate) : now;

        // Get previous rate
        const previousRate = liability.fxRateHistory?.length > 0
            ? liability.fxRateHistory[liability.fxRateHistory.length - 1].rate
            : liability.fxRateAtRecognition || 1;

        // Calculate amounts
        const totalOutstanding = Number(liability.totalOutstanding);
        const previousAmountInReporting = totalOutstanding * previousRate;
        const newAmountInReporting = totalOutstanding * newFxRate;
        const fxGainLoss = previousAmountInReporting - newAmountInReporting; // Positive = gain (liability decreased in reporting)

        // Update FX rate history
        const fxRateHistory = [
            ...(liability.fxRateHistory || []),
            {
                date: effDate.toISOString(),
                rate: newFxRate,
                source: fxSource,
                currency: liability.currency,
                reportingCurrency,
                previousRate,
                gainLoss: fxGainLoss,
            },
        ];

        // Update liability
        const updated = await (prisma as any).liability.update({
            where: { id: liability.id },
            data: {
                fxRateHistory,
                amountInReporting: newAmountInReporting,
                unrealizedFxGainLoss: Number(liability.unrealizedFxGainLoss) + fxGainLoss,
                fxSource,
                version: liability.version + 1,
                eventCount: liability.eventCount + 1,
            },
        });

        // Create event
        const eventId = `evt_${liability.liabilityId}_fx_revalued_${now.getTime()}`;

        await (prisma as any).liabilityEvent.create({
            data: {
                eventId,
                liabilityId: liability.id,
                eventType: LiabilityEventType.FX_REVALUED,
                timestamp: now,
                effectiveDate: effDate,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    currency: liability.currency,
                    reportingCurrency,
                    previousRate,
                    newRate: newFxRate,
                    fxSource,
                    totalOutstanding,
                    previousAmountInReporting,
                    newAmountInReporting,
                    fxGainLoss,
                    notes,
                },
                previousState: {
                    amountInReporting: previousAmountInReporting,
                    unrealizedFxGainLoss: Number(liability.unrealizedFxGainLoss),
                },
                previousEventId: liability.lastEventId,
                explanation: `FX revaluation: ${liability.currency}/${reportingCurrency} rate changed from ${previousRate} to ${newFxRate}. ${fxGainLoss >= 0 ? 'Gain' : 'Loss'}: ${reportingCurrency} ${Math.abs(fxGainLoss).toLocaleString()}`,
            },
        });

        // Update last event ID
        await (prisma as any).liability.update({
            where: { id: liability.id },
            data: { lastEventId: eventId },
        });

        return NextResponse.json({
            revaluation: {
                currency: liability.currency,
                reportingCurrency,
                previousRate,
                newRate: newFxRate,
                fxSource,
                totalOutstanding,
                previousAmountInReporting,
                newAmountInReporting,
                fxGainLoss,
                isGain: fxGainLoss >= 0,
            },
            liability: {
                id: updated.id,
                liabilityId: updated.liabilityId,
                amountInReporting: Number(updated.amountInReporting),
                unrealizedFxGainLoss: Number(updated.unrealizedFxGainLoss),
            },
            message: `FX revaluation recorded. ${fxGainLoss >= 0 ? 'Unrealized gain' : 'Unrealized loss'}: ${reportingCurrency} ${Math.abs(fxGainLoss).toLocaleString()}`,
            eventId,
        });
    } catch (error) {
        console.error('Error performing FX revaluation:', error);
        return NextResponse.json(
            { error: 'Failed to perform FX revaluation' },
            { status: 500 }
        );
    }
}