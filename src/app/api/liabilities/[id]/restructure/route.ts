// =============================================================================
// LIABILITIES API - Restructure (TS Section 5)
// src/app/api/liabilities/[id]/restructure/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    LiabilityStatus,
    LiabilityEventType,
    canTransitionTo,
} from '@/types/liabilities';

// =============================================================================
// POST - Restructure Liability
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
        const { reason, newTerms, effectiveDate, notes } = body;

        // Validate
        if (!reason?.trim()) {
            return NextResponse.json(
                { error: 'Restructure reason is required' },
                { status: 400 }
            );
        }
        if (!newTerms || Object.keys(newTerms).length === 0) {
            return NextResponse.json(
                { error: 'New terms are required for restructuring' },
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

        // Validate state transition
        if (!canTransitionTo(liability.status, LiabilityStatus.RESTRUCTURED)) {
            return NextResponse.json(
                {
                    error: `Cannot restructure liability from status '${liability.status}'`,
                    code: 'INVALID_STATE_TRANSITION',
                    currentStatus: liability.status,
                },
                { status: 400 }
            );
        }

        const now = new Date();
        const effDate = effectiveDate ? new Date(effectiveDate) : now;

        // Store original terms
        const originalTerms = {
            maturityDate: liability.maturityDate,
            interestRate: liability.interestRate ? Number(liability.interestRate) : null,
            interestType: liability.interestType,
            paymentFrequency: liability.paymentFrequency,
            regularPaymentAmount: liability.regularPaymentAmount ? Number(liability.regularPaymentAmount) : null,
            paymentSchedule: liability.paymentSchedule,
            outstandingPrincipal: Number(liability.outstandingPrincipal),
        };

        // Build update data from new terms
        const updateData: any = {
            status: LiabilityStatus.RESTRUCTURED,
            previousStatus: liability.status,
            statusChangedAt: now,
            statusChangedBy: session.user.id,
            isRestructured: true,
            restructuredDate: now,
            restructuredReason: reason,
            originalLiabilityId: liability.liabilityId,
            restructuredTerms: newTerms,
            version: liability.version + 1,
            eventCount: liability.eventCount + 1,
        };

        // Apply new terms
        if (newTerms.maturityDate) {
            updateData.maturityDate = new Date(newTerms.maturityDate);
        }
        if (newTerms.interestRate !== undefined) {
            updateData.interestRate = newTerms.interestRate;
        }
        if (newTerms.interestType) {
            updateData.interestType = newTerms.interestType;
        }
        if (newTerms.paymentFrequency) {
            updateData.paymentFrequency = newTerms.paymentFrequency;
        }
        if (newTerms.regularPaymentAmount !== undefined) {
            updateData.regularPaymentAmount = newTerms.regularPaymentAmount;
        }
        if (newTerms.paymentSchedule) {
            updateData.paymentSchedule = newTerms.paymentSchedule;
            updateData.totalPaymentsExpected = newTerms.paymentSchedule.length;
            updateData.paymentsCompleted = 0;
            updateData.paymentsMissed = 0;

            // Find next payment date
            const futurePayments = newTerms.paymentSchedule.filter(
                (p: any) => new Date(p.dueDate) > now
            );
            if (futurePayments.length > 0) {
                updateData.nextPaymentDate = new Date(futurePayments[0].dueDate);
            }
        }
        if (newTerms.outstandingPrincipal !== undefined) {
            updateData.outstandingPrincipal = newTerms.outstandingPrincipal;
            updateData.totalOutstanding = newTerms.outstandingPrincipal +
                Number(liability.accruedInterest) + Number(liability.feesPenalties);
        }

        // If was in default, clear default status
        if (liability.isInDefault) {
            updateData.isInDefault = false;
            updateData.defaultDate = null;
            updateData.defaultReason = null;
            updateData.daysOverdue = 0;
            updateData.riskLevel = 'medium'; // Lower risk after restructure
        }

        // Update liability
        const updated = await (prisma as any).liability.update({
            where: { id: liability.id },
            data: updateData,
        });

        // Create event
        const eventId = `evt_${liability.liabilityId}_restructured_${now.getTime()}`;

        await (prisma as any).liabilityEvent.create({
            data: {
                eventId,
                liabilityId: liability.id,
                eventType: LiabilityEventType.LIABILITY_RESTRUCTURED,
                timestamp: now,
                effectiveDate: effDate,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                payload: {
                    status: LiabilityStatus.RESTRUCTURED,
                    reason,
                    originalTerms,
                    newTerms,
                    notes,
                },
                previousState: {
                    status: liability.status,
                    ...originalTerms,
                },
                previousEventId: liability.lastEventId,
                explanation: `Liability ${liability.liabilityId} restructured. Reason: ${reason}`,
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
                totalOutstanding: Number(updated.totalOutstanding),
                interestRate: updated.interestRate ? Number(updated.interestRate) : null,
            },
            restructure: {
                eventId,
                reason,
                effectiveDate: effDate.toISOString(),
                originalTerms,
                newTerms,
            },
            message: `Liability ${liability.liabilityId} restructured successfully`,
        });
    } catch (error) {
        console.error('Error restructuring liability:', error);
        return NextResponse.json(
            { error: 'Failed to restructure liability' },
            { status: 500 }
        );
    }
}