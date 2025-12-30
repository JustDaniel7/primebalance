// =============================================================================
// LIABILITIES API - Approve Payment (TS Section 15.2, 15.3)
// src/app/api/liabilities/payments/[paymentId]/approve/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@/types/liabilities';

// =============================================================================
// POST - Approve Payment
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
        const { comments } = body;

        // Find payment
        const payment = await (prisma as any).liabilityPayment.findFirst({
            where: {
                OR: [
                    { id: paymentId },
                    { paymentId },
                ],
            },
            include: {
                liability: {
                    select: { organizationId: true },
                },
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
        if (payment.status !== PaymentStatus.PENDING_APPROVAL) {
            return NextResponse.json(
                {
                    error: `Cannot approve payment in status '${payment.status}'`,
                    code: 'PAYMENT_NOT_PENDING_APPROVAL',
                    currentStatus: payment.status,
                },
                { status: 400 }
            );
        }

        const now = new Date();

        // Update approval chain if multi-signature
        let approvalChain = payment.approvalChain || [];
        approvalChain.push({
            level: approvalChain.length + 1,
            approverId: session.user.id,
            approverName: session.user.name || session.user.email,
            status: 'approved',
            approvedAt: now.toISOString(),
            comments,
        });

        // Update payment
        const updated = await (prisma as any).liabilityPayment.update({
            where: { id: payment.id },
            data: {
                status: PaymentStatus.APPROVED,
                approvalStatus: 'approved',
                approvalChain,
                approvedBy: session.user.id,
                approvedAt: now,
            },
        });

        return NextResponse.json({
            payment: {
                ...updated,
                amount: Number(updated.amount),
            },
            message: `Payment ${payment.paymentId} approved`,
        });
    } catch (error) {
        console.error('Error approving payment:', error);
        return NextResponse.json(
            { error: 'Failed to approve payment' },
            { status: 500 }
        );
    }
}

// =============================================================================
// DELETE - Reject Payment
// =============================================================================

export async function DELETE(
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
        const { reason } = body;

        if (!reason?.trim()) {
            return NextResponse.json(
                { error: 'Rejection reason is required' },
                { status: 400 }
            );
        }

        // Find payment
        const payment = await (prisma as any).liabilityPayment.findFirst({
            where: {
                OR: [
                    { id: paymentId },
                    { paymentId },
                ],
            },
            include: {
                liability: {
                    select: { organizationId: true },
                },
            },
        });

        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        // Verify organization
        if (payment.liability.organizationId !== session.user.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const now = new Date();

        // Update approval chain
        let approvalChain = payment.approvalChain || [];
        approvalChain.push({
            level: approvalChain.length + 1,
            approverId: session.user.id,
            approverName: session.user.name || session.user.email,
            status: 'rejected',
            approvedAt: now.toISOString(),
            comments: reason,
        });

        // Update payment
        const updated = await (prisma as any).liabilityPayment.update({
            where: { id: payment.id },
            data: {
                status: PaymentStatus.CANCELLED,
                approvalStatus: 'rejected',
                approvalChain,
                failureReason: reason,
            },
        });

        return NextResponse.json({
            payment: {
                ...updated,
                amount: Number(updated.amount),
            },
            message: `Payment ${payment.paymentId} rejected`,
        });
    } catch (error) {
        console.error('Error rejecting payment:', error);
        return NextResponse.json(
            { error: 'Failed to reject payment' },
            { status: 500 }
        );
    }
}