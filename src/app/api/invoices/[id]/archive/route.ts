// =============================================================================
// INVOICES API - Archive Invoice (FIXED - No new fields required)
// src/app/api/invoices/[id]/archive/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Status constants
const ARCHIVABLE_STATUSES = ['paid', 'cancelled'];

// =============================================================================
// POST - Archive Invoice
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

        // Check if can archive
        if (!ARCHIVABLE_STATUSES.includes(invoice.status)) {
            return NextResponse.json(
                {
                    error: `Cannot archive invoice in ${invoice.status} status. Only paid or cancelled invoices can be archived.`,
                    code: 'INVALID_STATUS_TRANSITION',
                },
                { status: 400 }
            );
        }

        // Archive the invoice - only use fields that exist
        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                status: 'archived',
            },
        });

        // Create archive item
        try {
            await prisma.archiveItem.create({
                data: {
                    category: 'invoices',
                    status: 'archived',
                    originalId: invoice.id,
                    originalType: 'invoice',
                    title: `Invoice ${invoice.invoiceNumber}`,
                    description: `Invoice for ${(invoice.recipient as any)?.name || 'Customer'}`,
                    amount: invoice.total,
                    currency: invoice.currency,
                    counterparty: (invoice.recipient as any)?.name,
                    itemDate: invoice.invoiceDate,
                    fiscalYear: invoice.invoiceDate.getFullYear(),
                    metadata: {
                        invoiceNumber: invoice.invoiceNumber,
                        status: invoice.status,
                        total: Number(invoice.total),
                    },
                    archivedBy: session.user.id,
                    archiveReason: 'Invoice archived',
                    organizationId: session.user.organizationId,
                },
            });
        } catch (e) {
            console.log('Archive item creation skipped:', e);
        }

        return NextResponse.json({
            invoice: {
                ...updated,
                total: Number(updated.total),
                subtotal: Number(updated.subtotal),
                taxAmount: Number(updated.taxAmount),
                taxRate: Number(updated.taxRate),
            },
            message: 'Invoice archived successfully',
        });
    } catch (error) {
        console.error('Error archiving invoice:', error);
        return NextResponse.json(
            { error: 'Failed to archive invoice' },
            { status: 500 }
        );
    }
}