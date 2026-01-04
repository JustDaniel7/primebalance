// =============================================================================
// INVOICES API - Single Invoice Route (FIXED)
// src/app/api/invoices/[id]/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

// =============================================================================
// GET - Get Single Invoice
// =============================================================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionWithOrg();
    if (!user?.organizationId) return unauthorized();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeVersions = searchParams.get('includeVersions') === 'true';
    const includeEvents = searchParams.get('includeEvents') === 'true';
    const includePayments = searchParams.get('includePayments') === 'true';

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        order: {
          select: { id: true, orderNumber: true, status: true },
        },
      },
    });

    if (!invoice) return notFound('Invoice');

    // Fetch related data if requested and models exist
    let versions: any[] = [];
    let accountingEvents: any[] = [];
    let payments: any[] = [];

    if (includeVersions) {
      try {
        versions = await (prisma as any).invoiceVersion.findMany({
          where: { invoiceId: id },
          orderBy: { version: 'desc' },
        });
      } catch (error) {
        // Model may not exist in schema - log in development only
        if (process.env.NODE_ENV === 'development') {
          console.warn('InvoiceVersion model not found:', error);
        }
      }
    }

    if (includeEvents) {
      try {
        accountingEvents = await (prisma as any).invoiceAccountingEvent.findMany({
          where: { invoiceId: id },
          orderBy: { createdAt: 'desc' },
        });
      } catch (error) {
        // Model may not exist in schema - log in development only
        if (process.env.NODE_ENV === 'development') {
          console.warn('InvoiceAccountingEvent model not found:', error);
        }
      }
    }

    if (includePayments) {
      try {
        payments = await (prisma as any).invoicePayment.findMany({
          where: { invoiceId: id },
          orderBy: { paymentDate: 'desc' },
        });
      } catch (error) {
        // Model may not exist in schema - log in development only
        if (process.env.NODE_ENV === 'development') {
          console.warn('InvoicePayment model not found:', error);
        }
      }
    }

    // Get customer name from recipient if not stored separately
    const recipient = invoice.recipient as any;
    const customerName = (invoice as any).customerName || recipient?.name || '';

    return NextResponse.json({
      invoice: {
        ...invoice,
        customerName,
        total: Number(invoice.total),
        subtotal: Number(invoice.subtotal),
        taxAmount: Number(invoice.taxAmount),
        taxRate: Number(invoice.taxRate),
        paidAmount: Number((invoice as any).paidAmount || 0),
        outstandingAmount: Number((invoice as any).outstandingAmount || invoice.total),
        discountAmount: Number((invoice as any).discountAmount || 0),
        version: (invoice as any).version || 1,
      },
      versions,
      accountingEvents,
      payments,
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
        { error: 'Failed to fetch invoice' },
        { status: 500 }
    );
  }
}

// =============================================================================
// PATCH - Update Invoice (DRAFT only)
// =============================================================================

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionWithOrg();
    if (!user?.organizationId) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    // Fetch existing invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!invoice) return notFound('Invoice');

    // Check if editable (only DRAFT)
    if (invoice.status !== 'draft') {
      return NextResponse.json(
          {
            error: `Invoice in ${invoice.status} status is immutable. Only DRAFT invoices can be edited.`,
            code: 'INVOICE_IMMUTABLE',
          },
          { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};

    // Recipient/Customer fields
    if (body.recipient !== undefined) {
      updateData.recipient = body.recipient;
    }

    // Dates
    if (body.invoiceDate !== undefined) {
      updateData.invoiceDate = new Date(body.invoiceDate);
    }
    if (body.dueDate !== undefined) {
      updateData.dueDate = new Date(body.dueDate);
    }
    if (body.serviceDate !== undefined) {
      updateData.serviceDate = body.serviceDate ? new Date(body.serviceDate) : null;
    }

    // Items & recalculate totals
    if (body.items !== undefined) {
      const taxRate = body.taxRate ?? Number(invoice.taxRate);
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

      const subtotal = calculatedItems.reduce((sum: number, item: any) => sum + item.subtotal, 0);
      const taxAmount = calculatedItems.reduce((sum: number, item: any) => sum + item.taxAmount, 0);
      const total = subtotal + taxAmount;

      updateData.items = calculatedItems;
      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.total = total;
    }

    // Tax
    if (body.taxRate !== undefined) {
      updateData.taxRate = body.taxRate;
    }
    if (body.applyTax !== undefined) {
      updateData.applyTax = body.applyTax;
    }

    // Meta
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }
    if (body.internalNotes !== undefined) {
      updateData.internalNotes = body.internalNotes;
    }
    if (body.payment !== undefined) {
      updateData.payment = body.payment;
    }

    // Update invoice
    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      invoice: {
        ...updated,
        total: Number(updated.total),
        subtotal: Number(updated.subtotal),
        taxAmount: Number(updated.taxAmount),
        taxRate: Number(updated.taxRate),
      },
      message: 'Invoice updated successfully',
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
        { error: 'Failed to update invoice' },
        { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Soft Delete Invoice (DRAFT only) with 14-day recovery
// =============================================================================

export async function DELETE(
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

    // Check if deletable (only DRAFT)
    if (invoice.status !== 'draft') {
      return NextResponse.json(
          {
            error: 'Only DRAFT invoices can be deleted. Use cancel for confirmed invoices.',
            message: 'Only DRAFT invoices can be deleted. Use cancel for confirmed invoices.',
            code: 'INVOICE_IMMUTABLE',
          },
          { status: 403 }
      );
    }

    // Calculate permanent deletion date (14 days from now)
    const now = new Date();
    const permanentDeletionDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const warningDate = new Date(permanentDeletionDate.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days before

    // Soft delete - move to archive instead of hard delete
    const archiveRecordId = `AR-INV-${id}-${Date.now()}`;
    const archiveRecord = await prisma.archiveRecord.create({
      data: {
        archiveRecordId,
        originalObjectId: id,
        objectType: 'invoice',
        title: `Invoice ${invoice.invoiceNumber}`,
        description: `Deleted draft invoice for ${invoice.total} ${invoice.currency}`,
        category: 'financial',
        subcategory: 'invoices',
        content: invoice as any,
        contentHash: Buffer.from(JSON.stringify(invoice)).toString('base64').slice(0, 64),
        createdAt: invoice.createdAt,
        triggerType: 'user_action',
        triggerReason: 'Draft invoice deleted by user',
        initiatingActor: user.id,
        initiatingActorName: user.name || user.email,
        actorType: 'user',
        sourceModule: 'invoices',
        status: 'archived',
        retentionStatus: 'active',
        retentionStartDate: now,
        retentionEndDate: permanentDeletionDate,
        fiscalYear: now.getFullYear(),
        amount: invoice.total ? Number(invoice.total) : undefined,
        currency: invoice.currency,
        counterpartyName: invoice.customerName,
        organizationId: user.organizationId,
      },
    });

    // Update invoice status to deleted (soft delete)
    await prisma.invoice.update({
      where: { id },
      data: {
        status: 'deleted',
        updatedAt: now,
      },
    });

    return NextResponse.json({
      message: 'Invoice moved to trash. Will be permanently deleted in 14 days.',
      id,
      archiveId: archiveRecord.id,
      permanentDeletionDate: permanentDeletionDate.toISOString(),
      warningDate: warningDate.toISOString(),
      canRestore: true,
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
        { error: 'Failed to delete invoice' },
        { status: 500 }
    );
  }
}