// =============================================================================
// INVOICES API - Send Invoice (FIXED)
// src/app/api/invoices/[id]/send/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// POST - Mark Invoice as Sent
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

        // Check if can send (only CONFIRMED)
        if (invoice.status !== 'confirmed') {
            return NextResponse.json(
                {
                    error: `Cannot send invoice in ${invoice.status} status. Only confirmed invoices can be sent.`,
                    code: 'INVALID_STATUS_TRANSITION',
                },
                { status: 400 }
            );
        }

        // Mark as sent
        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                status: 'sent',
                sentAt: new Date(),
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
            message: 'Invoice marked as sent',
        });
    } catch (error) {
        console.error('Error sending invoice:', error);
        return NextResponse.json(
            { error: 'Failed to send invoice' },
            { status: 500 }
        );
    }
}