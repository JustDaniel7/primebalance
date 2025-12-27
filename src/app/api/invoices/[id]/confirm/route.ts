// =============================================================================
// INVOICES API - Confirm Invoice (FIXED)
// src/app/api/invoices/[id]/confirm/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// POST - Confirm Invoice
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
        const body = await request.json().catch(() => ({}));

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

        // Check if can confirm (only DRAFT)
        if (invoice.status !== 'draft') {
            return NextResponse.json(
                {
                    error: `Cannot confirm invoice in ${invoice.status} status. Only draft invoices can be confirmed.`,
                    code: 'INVALID_STATUS_TRANSITION',
                },
                { status: 400 }
            );
        }

        // Validate required fields
        const recipient = invoice.recipient as any;
        if (!recipient?.name) {
            return NextResponse.json(
                { error: 'Invoice must have a recipient name before confirmation' },
                { status: 400 }
            );
        }

        const items = invoice.items as any[];
        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: 'Invoice must have at least one line item' },
                { status: 400 }
            );
        }

        // Calculate outstanding amount
        const total = Number(invoice.total);
        const paidAmount = Number((invoice as any).paidAmount || 0);
        const outstandingAmount = total - paidAmount;

        // Confirm the invoice
        const updateData: any = {
            status: 'confirmed',
            confirmedAt: new Date(),
            confirmedBy: session.user.id,
            confirmedByName: session.user.name || session.user.email,
            outstandingAmount: outstandingAmount,
        };

        const updated = await prisma.invoice.update({
            where: { id },
            data: updateData,
        });

        // Try to create receivable
        try {
            await prisma.receivable.create({
                data: {
                    originType: 'invoice',
                    originReferenceId: invoice.invoiceNumber,
                    debtorName: recipient?.name || 'Unknown',
                    debtorEmail: recipient?.email,
                    currency: invoice.currency,
                    originalAmount: invoice.total,
                    outstandingAmount: invoice.total,
                    paidAmount: 0,
                    issueDate: invoice.invoiceDate,
                    dueDate: invoice.dueDate,
                    status: 'open',
                    riskLevel: 'low',
                    reference: `Invoice ${invoice.invoiceNumber}`,
                    organizationId: session.user.organizationId,
                },
            });
        } catch (e) {
            console.log('Receivable creation skipped:', e);
        }

        return NextResponse.json({
            invoice: {
                ...updated,
                total: Number(updated.total),
                subtotal: Number(updated.subtotal),
                taxAmount: Number(updated.taxAmount),
                taxRate: Number(updated.taxRate),
                outstandingAmount,
            },
            message: 'Invoice confirmed successfully',
        });
    } catch (error) {
        console.error('Error confirming invoice:', error);
        return NextResponse.json(
            { error: 'Failed to confirm invoice' },
            { status: 500 }
        );
    }
}