// =============================================================================
// INVOICES API - Main Route (FIXED)
// src/app/api/invoices/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// GET - List Invoices
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Filters
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const currency = searchParams.get('currency');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.invoiceDate = {};
      if (dateFrom) where.invoiceDate.gte = new Date(dateFrom);
      if (dateTo) where.invoiceDate.lte = new Date(dateTo);
    }

    if (currency) {
      where.currency = currency;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute queries
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { invoiceDate: 'desc' },
        take: limit,
        skip,
        include: {
          order: {
            select: { id: true, orderNumber: true },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    // Calculate statistics
    const allInvoices = await prisma.invoice.findMany({
      where: { organizationId: session.user.organizationId },
      select: { total: true, status: true },
    });

    const stats = {
      totalRevenue: allInvoices
          .filter(i => i.status !== 'draft' && i.status !== 'cancelled')
          .reduce((sum, i) => sum + Number(i.total), 0),
      totalPaid: allInvoices
          .filter(i => i.status === 'paid')
          .reduce((sum, i) => sum + Number(i.total), 0),
      totalOutstanding: allInvoices
          .filter(i => ['confirmed', 'sent', 'partially_paid', 'overdue'].includes(i.status))
          .reduce((sum, i) => sum + Number(i.total), 0),
      count: allInvoices.length,
    };

    return NextResponse.json({
      invoices: invoices.map((inv) => {
        const recipient = inv.recipient as any;
        return {
          ...inv,
          customerName: (inv as any).customerName || recipient?.name || '',
          customerEmail: (inv as any).customerEmail || recipient?.email || '',
          total: Number(inv.total),
          subtotal: Number(inv.subtotal),
          taxAmount: Number(inv.taxAmount),
          taxRate: Number(inv.taxRate),
          paidAmount: Number((inv as any).paidAmount || 0),
          outstandingAmount: Number((inv as any).outstandingAmount || inv.total),
          discountAmount: Number((inv as any).discountAmount || 0),
          version: (inv as any).version || 1,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statistics: stats,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create Invoice
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Support both new format (customerName) and old format (recipient.name)
    const customerName = body.customerName || body.recipient?.name;
    const customerEmail = body.customerEmail || body.recipient?.email;

    // Validate required fields
    if (!customerName) {
      return NextResponse.json(
          { error: 'Customer name is required (customerName or recipient.name)' },
          { status: 400 }
      );
    }

    if (!body.invoiceDate || !body.dueDate) {
      return NextResponse.json(
          { error: 'Invoice date and due date are required' },
          { status: 400 }
      );
    }

    if (!body.items?.length) {
      return NextResponse.json(
          { error: 'At least one line item is required' },
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
    const invoiceNumber = body.invoiceNumber || `INV-${year}-${String(nextNum).padStart(5, '0')}`;

    // Calculate line items
    const taxRate = body.taxRate ?? 19;
    const calculatedItems = body.items.map((item: any, idx: number) => {
      const subtotal = item.quantity * item.unitPrice;
      const itemTaxRate = item.taxRate ?? taxRate;
      const itemTaxAmount = subtotal * (itemTaxRate / 100);
      const total = subtotal + itemTaxAmount;

      return {
        id: item.id || `item_${idx + 1}`,
        position: idx + 1,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'pcs',
        unitPrice: item.unitPrice,
        taxRate: itemTaxRate,
        subtotal,
        taxAmount: itemTaxAmount,
        total,
      };
    });

    // Calculate totals
    const subtotal = calculatedItems.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const taxAmount = calculatedItems.reduce((sum: number, item: any) => sum + item.taxAmount, 0);
    const total = subtotal + taxAmount;

    // Build recipient object for legacy support
    const recipient = body.recipient || {
      name: customerName,
      email: customerEmail,
      address: body.customerAddress?.street,
      city: body.customerAddress?.city,
      postalCode: body.customerAddress?.postalCode,
      country: body.customerAddress?.country,
    };

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        status: 'draft',

        // Recipient (legacy format)
        sender: body.sender || {},
        recipient,

        // Dates
        invoiceDate: new Date(body.invoiceDate),
        dueDate: new Date(body.dueDate),
        serviceDate: body.serviceDate ? new Date(body.serviceDate) : null,
        servicePeriodStart: body.servicePeriodStart ? new Date(body.servicePeriodStart) : null,
        servicePeriodEnd: body.servicePeriodEnd ? new Date(body.servicePeriodEnd) : null,

        // Items & Totals
        items: calculatedItems,
        currency: body.currency || 'EUR',
        subtotal,
        taxAmount,
        total,

        // Tax
        applyTax: body.applyTax ?? true,
        taxRate,
        taxExemptReason: body.taxExemptReason,
        taxExemptNote: body.taxExemptNote,

        // Payment
        payment: body.payment || { method: 'bank_transfer', dueInDays: 30 },

        // Meta
        notes: body.notes,
        internalNotes: body.internalNotes,
        language: body.language || 'en',

        // Recurring
        isRecurring: body.isRecurring || false,
        recurringInterval: body.recurringInterval,
        nextRecurringDate: body.nextRecurringDate ? new Date(body.nextRecurringDate) : null,

        // Link to order
        orderId: body.orderId,

        // Organization
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({
      invoice: {
        ...invoice,
        customerName,
        customerEmail,
        total: Number(invoice.total),
        subtotal: Number(invoice.subtotal),
        taxAmount: Number(invoice.taxAmount),
        taxRate: Number(invoice.taxRate),
        paidAmount: 0,
        outstandingAmount: Number(invoice.total),
        discountAmount: 0,
        version: 1,
      },
      message: 'Invoice created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
        { error: 'Failed to create invoice' },
        { status: 500 }
    );
  }
}