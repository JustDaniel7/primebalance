// =============================================================================
// LIABILITIES API - Execute Payment (TS Section 15)
// src/app/api/liabilities/payments/[paymentId]/execute/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    LiabilityStatus,
    LiabilityEventType,
    PaymentStatus,
    calculateTotalOutstanding,
} from '@/types/liabilities';

// =============================================================================
// POST - Execute Payment
// =============================================================================

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ paymentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { paymentId } = await params;
        const body = await request.json();
        const {
            executionDate,
            paymentMethod,
            bankReference,
            transactionId,
            notes,
        } = body;

        // Find payment
        const payment = await (prisma as any).liabilityPayment.findFirst({
            where: {
                OR: [
                    { id: paymentId },
                    { paymentId },
                ],
            },
            include: {
                liability: true,
            },
        });

        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        // Verify organization
        if (payment.liability.organizationId !== session.user.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Check payment status
        const executableStatuses = [PaymentStatus.SCHEDULED, PaymentStatus.APPROVED, PaymentStatus.INITIATED];
        if (!executableStatuses.includes(payment.status)) {
            return NextResponse.json(
                {
                    error: `Cannot execute payment in status '${payment.status}'`,
                    code: 'PAYMENT_NOT_EXECUTABLE',
                    currentStatus: payment.status,
                },
                { status: 400 }
            );
        }

        // Check if approval required but not approved
        if (payment.requiresApproval && payment.status !== PaymentStatus.APPROVED) {
            return NextResponse.json(
                {
                    error: 'Payment requires approval before execution',
                    code: 'APPROVAL_REQUIRED',
                },
                { status: 400 }
            );
        }

        const now = new Date();
        const execDate = executionDate ? new Date(executionDate) : now;
        const liability = payment.liability;

        // Calculate new balances
        const principalAmount = Number(payment.principalAmount);
        const interestAmount = Number(payment.interestAmount);
        const feesAmount = Number(payment.feesAmount);
        const totalAmount = Number(payment.amount);

        const newOutstandingPrincipal = Math.max(0, Number(liability.outstandingPrincipal) - principalAmount);
        const newAccruedInterest = Math.max(0, Number(liability.accruedInterest) - interestAmount);
        const newFeesPenalties = Math.max(0, Number(liability.feesPenalties) - feesAmount);
        const newTotalOutstanding = calculateTotalOutstanding(
            newOutstandingPrincipal,
            newAccruedInterest,
            newFeesPenalties
        );
        const newTotalSettled = Number(liability.totalSettled) + totalAmount;

        // Determine new liability status
        let newStatus = liability.status;
        if (newTotalOutstanding <= 0.01) {
            newStatus = LiabilityStatus.FULLY_SETTLED;
        } else if (liability.status === LiabilityStatus.ACTIVE) {
            newStatus = LiabilityStatus.PARTIALLY_SETTLED;
        }

        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Update payment
            const updatedPayment = await (tx as any).liabilityPayment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.EXECUTED,
                    paymentDate: execDate,
                    executedAt: now,
                    executedBy: session.user.id,
                    paymentMethod,
                    bankReference,
                    transactionId,
                    notes: notes || payment.notes,
                },
            });

            // Calculate next payment date
            const nextPayment = await (tx as any).liabilityPayment.findFirst({
                where: {
                    liabilityId: liability.id,
                    status: { in: [PaymentStatus.SCHEDULED, PaymentStatus.APPROVED] },
                    scheduledDate: { gt: now },
                },
                orderBy: { scheduledDate: 'asc' },
            });

            // Create event ID
            const eventId = `evt_${liability.liabilityId}_payment_executed_${now.getTime()}`;

            // Update liability with all fields including lastEventId
            const updatedLiability = await (tx as any).liability.update({
                where: { id: liability.id },
                data: {
                    status: newStatus,
                    previousStatus: newStatus !== liability.status ? liability.status : undefined,
                    statusChangedAt: newStatus !== liability.status ? now : undefined,
                    statusChangedBy: newStatus !== liability.status ? session.user.id : undefined,
                    outstandingPrincipal: newOutstandingPrincipal,
                    accruedInterest: newAccruedInterest,
                    feesPenalties: newFeesPenalties,
                    totalOutstanding: newTotalOutstanding,
                    totalSettled: newTotalSettled,
                    lastPaymentDate: execDate,
                    nextPaymentDate: nextPayment?.scheduledDate || null,
                    nextCashOutflow: nextPayment?.scheduledDate || liability.maturityDate,
                    settledDate: newStatus === LiabilityStatus.FULLY_SETTLED ? execDate : null,
                    paymentsCompleted: liability.paymentsCompleted + 1,
                    expectedCashImpact: newTotalOutstanding,
                    version: liability.version + 1,
                    eventCount: liability.eventCount + 1,
                    lastEventId: eventId,
                },
            });

            // Create event
            await (tx as any).liabilityEvent.create({
                data: {
                    eventId,
                    liabilityId: liability.id,
                    eventType: LiabilityEventType.PAYMENT_EXECUTED,
                    timestamp: now,
                    effectiveDate: execDate,
                    actorId: session.user.id,
                    actorName: session.user.name || session.user.email,
                    actorType: 'user',
                    payload: {
                        paymentId: payment.paymentId,
                        amount: totalAmount,
                        principalAmount,
                        interestAmount,
                        feesAmount,
                        paymentMethod,
                        bankReference,
                        transactionId,
                        outstandingBefore: Number(liability.totalOutstanding),
                        outstandingAfter: newTotalOutstanding,
                        newStatus,
                    },
                    previousState: {
                        status: liability.status,
                        outstandingPrincipal: Number(liability.outstandingPrincipal),
                        totalOutstanding: Number(liability.totalOutstanding),
                    },
                    previousEventId: liability.lastEventId,
                    explanation: `Payment of ${liability.currency} ${totalAmount.toLocaleString()} executed. ${newStatus === LiabilityStatus.FULLY_SETTLED ? 'Liability fully settled.' : `Remaining: ${liability.currency} ${newTotalOutstanding.toLocaleString()}`}`,
                },
            });

            return { updatedPayment, updatedLiability, eventId };
        });

        return NextResponse.json({
            payment: {
                ...result.updatedPayment,
                amount: Number(result.updatedPayment.amount),
                principalAmount: Number(result.updatedPayment.principalAmount),
                interestAmount: Number(result.updatedPayment.interestAmount),
                feesAmount: Number(result.updatedPayment.feesAmount),
            },
            liability: {
                id: result.updatedLiability.id,
                liabilityId: result.updatedLiability.liabilityId,
                status: result.updatedLiability.status,
                outstandingPrincipal: Number(result.updatedLiability.outstandingPrincipal),
                totalOutstanding: Number(result.updatedLiability.totalOutstanding),
                totalSettled: Number(result.updatedLiability.totalSettled),
            },
            message: newStatus === LiabilityStatus.FULLY_SETTLED
                ? `Payment executed. Liability ${liability.liabilityId} fully settled.`
                : `Payment of ${liability.currency} ${totalAmount.toLocaleString()} executed`,
            eventId: result.eventId,
        });
    } catch (error) {
        console.error('Error executing payment:', error);
        return NextResponse.json(
            { error: 'Failed to execute payment' },
            { status: 500 }
        );
    }
}