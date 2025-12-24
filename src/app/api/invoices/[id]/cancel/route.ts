// =============================================================================
// INVOICES API - Cancel Invoice (FIXED - No new fields required)
// src/app/api/invoices/[id]/cancel/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Status constants
const CANCELLABLE_STATUSES = ['draft', 'confirmed', 'sent', 'overdue'];

// =============================================================================
// POST - Cancel Invoice
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
        const { reason } = body;

        if (!reason?.trim()) {
            return NextResponse.json(
                { error: 'Cancellation reason is required' },
                { status: 400 }
            );
        }

        // Fetch existing invoice
        const invoice = await prisma.invoice.findFirst({
            where: {
                id,
                organizationId: session.user.organizationId,
            },
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Check if can cancel
        if (!CANCELLABLE_STATUSES.includes(invoice.status)) {
            return NextResponse.json(
                {
                    error: `Cannot cancel invoice in ${invoice.status} status.`,
                    code: 'INVALID_STATUS_TRANSITION',
                },
                { status: 400 }
            );
        }

        // Check if has payments (using paidAmount if available)
        const paidAmount = Number((invoice as any).paidAmount || 0);
        if (paidAmount > 0) {
            return NextResponse.json(
                {
                    error: 'Cannot cancel invoice with payments. Reverse payments first.',
                    code: 'HAS_PAYMENTS',
                },
                { status: 400 }
            );
        }

        // Cancel the invoice - only use fields that exist
        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                status: 'cancelled',
                internalNotes: invoice.internalNotes
                    ? `${invoice.internalNotes}\n\nCancelled: ${reason}`
                    : `Cancelled: ${reason}`,
            },
        });

        return NextResponse.json({
            invoice: {
                ...updated,
                total: Number(updated.total),
                subtotal: Number(updated.subtotal),
                taxAmount: Number(updated.taxAmount),
                taxRate: Number(updated.taxRate),
            },
            message: 'Invoice cancelled successfully',
        });
    } catch (error) {
        console.error('Error cancelling invoice:', error);
        return NextResponse.json(
            { error: 'Failed to cancel invoice' },
            { status: 500 }
        );
    }
}