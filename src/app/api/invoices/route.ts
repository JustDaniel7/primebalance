// =============================================================================
// INVOICES API - Main Route
// src/app/api/invoices/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';
import { createInvoiceSchema, validateRequest } from '@/lib/validation';

// =============================================================================
// GET - List Invoices
// =============================================================================

export async function GET(request: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  try {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      organizationId: user.organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.invoiceDate = dateFilter;
    }

    if (currency) {
      where.currency = currency;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute all queries in parallel (optimized - removed sequential stats query)
    const [invoices, total, revenueStats, paidStats, outstandingStats, totalCount] = await Promise.all([
      // Main invoice list
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
      // Count for pagination
      prisma.invoice.count({ where }),
      // Revenue aggregation (excludes draft and cancelled)
      prisma.invoice.aggregate({
        where: {
          organizationId: user.organizationId,
          status: { notIn: ['draft', 'cancelled'] },
        },
        _sum: { total: true },
      }),
      // Paid total
      prisma.invoice.aggregate({
        where: {
          organizationId: user.organizationId,
          status: 'paid',
        },
        _sum: { total: true },
      }),
      // Outstanding total
      prisma.invoice.aggregate({
        where: {
          organizationId: user.organizationId,
          status: { in: ['confirmed', 'sent', 'partially_paid', 'overdue'] },
        },
        _sum: { total: true },
      }),
      // Total count
      prisma.invoice.count({
        where: { organizationId: user.organizationId },
      }),
    ]);

    // Build stats from aggregation results (no JS filtering needed!)
    const stats = {
      totalRevenue: Number(revenueStats._sum.total) || 0,
      totalPaid: Number(paidStats._sum.total) || 0,
      totalOutstanding: Number(outstandingStats._sum.total) || 0,
      count: totalCount,
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
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  try {
    const body = await request.json();

    // Validate request body with Zod schema
    const validation = validateRequest(createInvoiceSchema, body);
    if (!validation.success) {
      return badRequest(validation.error);
    }

    const validatedData = validation.data;

    // Support both new format (customerName) and old format (recipient.name)
    const customerName = validatedData.customerName || validatedData.recipient?.name || '';
    const customerEmail = validatedData.customerEmail || validatedData.recipient?.email;

    // Parse validated dates
    const invoiceDate = new Date(validatedData.invoiceDate);
    const dueDate = new Date(validatedData.dueDate);

    // Additional date logic validation
    if (dueDate < invoiceDate) {
      return badRequest('Due date cannot be before invoice date');
    }

    // Generate invoice number
    const year = new Date().getFullYear();
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        organizationId: user.organizationId,
        invoiceNumber: { startsWith: `INV-${year}` },
      },
      orderBy: { invoiceNumber: 'desc' },
    });

    let nextNum = 1;
    if (lastInvoice) {
      const match = lastInvoice.invoiceNumber.match(/INV-\d{4}-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const invoiceNumber = validatedData.invoiceNumber || `INV-${year}-${String(nextNum).padStart(5, '0')}`;

    // Calculate line items with validated data
    const taxRate = validatedData.taxRate ?? 19;
    const calculatedItems = validatedData.items.map((item, idx) => {
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
    const subtotal = calculatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = calculatedItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = subtotal + taxAmount;

    // Build recipient object for legacy support
    const customerAddr = validatedData.customerAddress as Record<string, string> | undefined;
    const recipient = validatedData.recipient || {
      name: customerName,
      email: customerEmail || undefined,
      address: customerAddr?.street,
      city: customerAddr?.city,
      postalCode: customerAddr?.postalCode,
      country: customerAddr?.country,
    };

    // Create invoice with validated data
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        status: 'draft',

        // Recipient (legacy format)
        sender: (validatedData.sender || {}) as Record<string, string>,
        recipient,

        // Dates (already validated above)
        invoiceDate,
        dueDate,
        serviceDate: validatedData.serviceDate ? new Date(validatedData.serviceDate) : null,
        servicePeriodStart: validatedData.servicePeriodStart ? new Date(validatedData.servicePeriodStart) : null,
        servicePeriodEnd: validatedData.servicePeriodEnd ? new Date(validatedData.servicePeriodEnd) : null,

        // Items & Totals
        items: calculatedItems,
        currency: validatedData.currency || 'EUR',
        subtotal,
        taxAmount,
        total,

        // Tax
        applyTax: validatedData.applyTax ?? true,
        taxRate,
        taxExemptReason: validatedData.taxExemptReason,
        taxExemptNote: validatedData.taxExemptNote,

        // Payment
        payment: validatedData.payment || { method: 'bank_transfer', dueInDays: 30 },

        // Meta
        notes: validatedData.notes,
        internalNotes: validatedData.internalNotes,
        language: validatedData.language || 'en',

        // Recurring
        isRecurring: validatedData.isRecurring || false,
        recurringInterval: validatedData.recurringInterval,
        nextRecurringDate: validatedData.nextRecurringDate ? new Date(validatedData.nextRecurringDate) : null,

        // Link to order
        orderId: validatedData.orderId,

        // Organization
        organizationId: user.organizationId,
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