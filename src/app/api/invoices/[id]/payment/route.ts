// =============================================================================
// INVOICES API - Apply Payment (FIXED)
// src/app/api/invoices/[id]/payment/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';
import { notifyOrgAdmins } from '@/lib/notifications';

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

        const organizationId = user.organizationId;

        // Use a serializable transaction to prevent race conditions
        const result = await prisma.$transaction(async (tx) => {
            // Fetch and lock the invoice within transaction
            const invoice = await tx.invoice.findFirst({
                where: {
                    id,
                    organizationId,
                },
            });

            if (!invoice) {
                throw new Error('INVOICE_NOT_FOUND');
            }

            // Check if can accept payment
            if (!PAYABLE_STATUSES.includes(invoice.status)) {
                throw new Error(`INVALID_STATUS:${invoice.status}`);
            }

            // Calculate amounts
            const invoiceTotal = Number(invoice.total);
            const currentPaid = Number((invoice as any).paidAmount || 0);
            const currentOutstanding = Number((invoice as any).outstandingAmount || invoiceTotal);

            if (amount > currentOutstanding) {
                throw new Error(`OVERPAYMENT:${amount}:${currentOutstanding}`);
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

            const updated = await tx.invoice.update({
                where: { id },
                data: updateData,
            });

            // Try to create payment record if model exists
            let paymentRecord = null;
            try {
                paymentRecord = await (tx as any).invoicePayment.create({
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
                await tx.receivable.updateMany({
                    where: {
                        originReferenceId: invoice.invoiceNumber,
                        organizationId,
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

            return {
                updated,
                paymentRecord,
                newPaidAmount,
                newOutstandingAmount,
                isFullyPaid,
            };
        }, {
            isolationLevel: 'Serializable', // Prevent race conditions
        });

        // Notify organization admins about the payment
        const currency = result.updated.currency || 'USD';
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);

        await notifyOrgAdmins(
            user.organizationId,
            result.isFullyPaid ? 'invoice_paid' : 'invoice_created',
            result.isFullyPaid ? 'Invoice Fully Paid' : 'Payment Received',
            result.isFullyPaid
                ? `Invoice #${result.updated.invoiceNumber} (${formattedAmount}) has been fully paid`
                : `Payment of ${formattedAmount} received for Invoice #${result.updated.invoiceNumber}`
        );

        return NextResponse.json({
            invoice: {
                ...result.updated,
                total: Number(result.updated.total),
                subtotal: Number(result.updated.subtotal),
                taxAmount: Number(result.updated.taxAmount),
                taxRate: Number(result.updated.taxRate),
                paidAmount: result.newPaidAmount,
                outstandingAmount: result.newOutstandingAmount,
            },
            payment: result.paymentRecord,
            message: result.isFullyPaid ? 'Invoice fully paid' : 'Payment applied successfully',
        });
    } catch (error: any) {
        // Handle transaction errors
        if (error.message === 'INVOICE_NOT_FOUND') {
            return notFound('Invoice');
        }
        if (error.message?.startsWith('INVALID_STATUS:')) {
            const status = error.message.split(':')[1];
            return NextResponse.json(
                {
                    error: `Cannot apply payment to invoice in ${status} status.`,
                    code: 'INVALID_STATUS',
                },
                { status: 400 }
            );
        }
        if (error.message?.startsWith('OVERPAYMENT:')) {
            const [, amt, outstanding] = error.message.split(':');
            return NextResponse.json(
                {
                    error: `Payment amount (${amt}) exceeds outstanding amount (${outstanding})`,
                    code: 'OVERPAYMENT',
                },
                { status: 400 }
            );
        }

        console.error('Error applying payment:', error);
        return NextResponse.json(
            { error: 'Failed to apply payment' },
            { status: 500 }
        );
    }
}