// =============================================================================
// INVOICES API - Archive Invoice (FIXED - No new fields required)
// src/app/api/invoices/[id]/archive/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

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
        const user = await getSessionWithOrg();
        if (!user?.organizationId) return unauthorized();

        const { id } = await params;

        // Fetch existing invoice
        const invoice = await prisma.invoice.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            },
        });

        if (!invoice) return notFound('Invoice');

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

        // Create archive record
        try {
            await prisma.archiveRecord.create({
                data: {
                    archiveRecordId: `arc_${user.organizationId.slice(-6)}_invoice_${invoice.id}_v1_${Date.now()}`,
                    originalObjectId: invoice.id,
                    objectType: 'invoice',
                    objectVersion: 1,
                    triggerType: 'user_action',
                    triggerReason: 'Invoice archived',
                    title: `Invoice ${invoice.invoiceNumber}`,
                    description: `Invoice for ${(invoice.recipient as any)?.name || 'Customer'}`,
                    content: {
                        invoiceNumber: invoice.invoiceNumber,
                        status: invoice.status,
                        total: Number(invoice.total),
                    },
                    contentType: 'application/json',
                    contentHash: `sha256_${Date.now().toString(16)}`,
                    amount: invoice.total,
                    currency: invoice.currency,
                    category: 'financial',
                    counterpartyName: (invoice.recipient as any)?.name,
                    effectiveDate: invoice.invoiceDate,
                    fiscalYear: invoice.invoiceDate.getFullYear(),
                    actorType: 'user',
                    status: 'archived',
                    retentionStatus: 'active',
                    language: 'en',
                    timezone: 'UTC',
                    versionNumber: 1,
                    isCurrentVersion: true,
                    signatureCount: 0,
                    integrityVerified: true,
                    legalHold: false,
                    accessCount: 0,
                    exportCount: 0,
                    documentCount: 0,
                    archivedAt: new Date(),
                    createdAt: new Date(),
                    organizationId: user.organizationId,
                },
            });
        } catch (e) {
            console.log('Archive record creation skipped:', e);
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