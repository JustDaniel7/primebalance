// =============================================================================
// INVOICES API - Apply Payment (FIXED)
// src/app/api/invoices/[id]/payment/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

// Status constants
const PAYABLE_STATUSES = ['confirmed', 'sent', 'partially_paid', 'overdue'];

// =============================================================================
// GET - Get Invoice Payments
// =============================================================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getSessionWithOrg();
        if (!user?.organizationId) return unauthorized();

        const { id } = await params;

        // Verify invoice exists
        const invoice = await prisma.invoice.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            },
        });

        if (!invoice) return notFound('Invoice');

        // Try to get payments if model exists
        let payments: any[] = [];
        try {
            payments = await (prisma as any).invoicePayment.findMany({
                where: { invoiceId: id },
                orderBy: { paymentDate: 'desc' },
            });
        } catch {
            // Model doesn't exist yet
        }

        return NextResponse.json({ payments });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payments' },
            { status: 500 }
        );
    }
}

// =============================================================================
// POST - Apply Payment
// =============================================================================

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getSessionWithOrg();
        if (!user?.organizationId) return unauthorized();

        const { id } = await params;
        const body = await request.json();

        const { amount, paymentDate, paymentMethod, reference, notes } = body;

        // Validate required fields
        if (!amount || amount <= 0) return badRequest('Payment amount must be positive');
        if (!paymentDate) return badRequest('Payment date is required');

        // Fetch existing invoice
        const invoice = await prisma.invoice.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            },
        });

        if (!invoice) return notFound('Invoice');

        // Check if can accept payment
        if (!PAYABLE_STATUSES.includes(invoice.status)) {
            return NextResponse.json(
                {
                    error: `Cannot apply payment to invoice in ${invoice.status} status.`,
                    code: 'INVALID_STATUS',
                },
                { status: 400 }
            );
        }

        // Calculate amounts
        const invoiceTotal = Number(invoice.total);
        const currentPaid = Number((invoice as any).paidAmount || 0);
        const currentOutstanding = Number((invoice as any).outstandingAmount || invoiceTotal);

        if (amount > currentOutstanding) {
            return NextResponse.json(
                {
                    error: `Payment amount (${amount}) exceeds outstanding amount (${currentOutstanding})`,
                    code: 'OVERPAYMENT',
                },
                { status: 400 }
            );
        }

        const newPaidAmount = currentPaid + amount;
        const newOutstandingAmount = invoiceTotal - newPaidAmount;
        const isFullyPaid = newOutstandingAmount <= 0.01; // Allow for rounding

        // Determine new status
        let newStatus = invoice.status;
        if (isFullyPaid) {
            newStatus = 'paid';
        } else if (newPaidAmount > 0) {
            newStatus = 'partially_paid';
        }

        // Update invoice
        const updateData: any = {
            status: newStatus,
            paidAmount: newPaidAmount,
            outstandingAmount: newOutstandingAmount,
        };

        if (isFullyPaid) {
            updateData.paidAt = new Date();
        }

        const updated = await prisma.invoice.update({
            where: { id },
            data: updateData,
        });

        // Try to create payment record if model exists
        let paymentRecord = null;
        try {
            paymentRecord = await (prisma as any).invoicePayment.create({
                data: {
                    invoiceId: id,
                    amount,
                    currency: invoice.currency,
                    paymentDate: new Date(paymentDate),
                    paymentMethod: paymentMethod || 'bank_transfer',
                    reference,
                    notes,
                    status: 'completed',
                },
            });
        } catch {
            // Model doesn't exist yet
        }

        // Update related receivable if exists
        try {
            await prisma.receivable.updateMany({
                where: {
                    originReferenceId: invoice.invoiceNumber,
                    organizationId: user.organizationId,
                },
                data: {
                    paidAmount: newPaidAmount,
                    outstandingAmount: newOutstandingAmount,
                    status: isFullyPaid ? 'paid' : 'partially_paid',
                    lastActivityDate: new Date(),
                },
            });
        } catch {
            // Receivable might not exist
        }

        return NextResponse.json({
            invoice: {
                ...updated,
                total: Number(updated.total),
                subtotal: Number(updated.subtotal),
                taxAmount: Number(updated.taxAmount),
                taxRate: Number(updated.taxRate),
                paidAmount: newPaidAmount,
                outstandingAmount: newOutstandingAmount,
            },
            payment: paymentRecord,
            message: isFullyPaid ? 'Invoice fully paid' : 'Payment applied successfully',
        });
    } catch (error) {
        console.error('Error applying payment:', error);
        return NextResponse.json(
            { error: 'Failed to apply payment' },
            { status: 500 }
        );
    }
}