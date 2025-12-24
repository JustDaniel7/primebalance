// =============================================================================
// INVOICES API - Create from Order (FIXED)
// src/app/api/invoices/from-order/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// POST - Create Invoice from Order
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, includeAllItems = true, selectedItemIds } = body;

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Fetch order
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                organizationId: session.user.organizationId,
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Check order status
        if (!['confirmed', 'in_progress', 'partially_completed', 'completed'].includes(order.status)) {
            return NextResponse.json(
                {
                    error: `Cannot create invoice from order in ${order.status} status`,
                    code: 'INVALID_ORDER_STATUS',
                },
                { status: 400 }
            );
        }

        // Generate invoice number
        const year = new Date().getFullYear();
        const lastInvoice = await prisma.invoice.findFirst({
            where: {
                organizationId: session.user.organizationId,
                invoiceNumber: { startsWith: `INV-${year}` },
            },
            orderBy: { invoiceNumber: 'desc' },
        });

        let nextNum = 1;
        if (lastInvoice) {
            const match = lastInvoice.invoiceNumber.match(/INV-\d{4}-(\d+)/);
            if (match) nextNum = parseInt(match[1]) + 1;
        }
        const invoiceNumber = `INV-${year}-${String(nextNum).padStart(5, '0')}`;

        // Get items from order
        let orderItems = (order.items as any[]) || [];

        // Filter items if specific ones selected
        if (!includeAllItems && selectedItemIds?.length > 0) {
            orderItems = orderItems.filter((item: any) =>
                selectedItemIds.includes(item.id)
            );
        }

        if (orderItems.length === 0) {
            return NextResponse.json(
                { error: 'No items to invoice' },
                { status: 400 }
            );
        }

        // Map order items to invoice items
        const invoiceItems = orderItems.map((item: any, idx: number) => ({
            id: `item_${idx + 1}`,
            position: idx + 1,
            description: item.description || item.name,
            quantity: item.quantity,
            unit: item.unit || 'pcs',
            unitPrice: item.unitPrice || item.price,
            taxRate: item.taxRate || Number(order.taxRate) || 19,
            subtotal: item.quantity * (item.unitPrice || item.price),
            taxAmount: (item.quantity * (item.unitPrice || item.price)) * ((item.taxRate || Number(order.taxRate) || 19) / 100),
            total: (item.quantity * (item.unitPrice || item.price)) * (1 + (item.taxRate || Number(order.taxRate) || 19) / 100),
        }));

        // Calculate totals
        const subtotal = invoiceItems.reduce((sum: number, item: any) => sum + item.subtotal, 0);
        const taxAmount = invoiceItems.reduce((sum: number, item: any) => sum + item.taxAmount, 0);
        const total = subtotal + taxAmount;

        // Calculate due date (30 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        // Create invoice
        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                status: 'draft',

                // Customer info from order
                sender: {},
                recipient: {
                    name: order.customerName,
                    email: order.customerEmail,
                    address: order.customerAddress,
                },

                // Dates
                invoiceDate: new Date(),
                dueDate,

                // Items & Totals
                items: invoiceItems,
                currency: order.currency,
                subtotal,
                taxAmount,
                total,

                // Tax
                applyTax: true,
                taxRate: order.taxRate,

                // Payment
                payment: { method: 'bank_transfer', dueInDays: 30 },

                // Meta
                notes: `Created from Order ${order.orderNumber}`,
                language: 'en',

                // Link to order
                orderId: order.id,

                // Organization
                organizationId: session.user.organizationId,
            },
        });

        // Update order invoiced amount
        try {
            const currentInvoiced = Number(order.invoicedAmount || 0);
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    invoicedAmount: currentInvoiced + total,
                },
            });
        } catch {
            // Field might not exist
        }

        return NextResponse.json({
            invoice: {
                ...invoice,
                total: Number(invoice.total),
                subtotal: Number(invoice.subtotal),
                taxAmount: Number(invoice.taxAmount),
                taxRate: Number(invoice.taxRate),
            },
            message: 'Invoice created from order successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating invoice from order:', error);
        return NextResponse.json(
            { error: 'Failed to create invoice from order' },
            { status: 500 }
        );
    }
}