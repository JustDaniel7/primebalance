// =============================================================================
// ARCHIVE API - Restore Route
// src/app/api/archive/[id]/restore/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// POST - Restore Archived Item to Active System
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

    // Fetch the archive record
    const record = await (prisma as any).archiveRecord.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'Archive record not found' }, { status: 404 });
    }

    // Check if record is on legal hold
    if (record.legalHold) {
      return NextResponse.json({
        error: 'Cannot restore item on legal hold',
        code: 'LEGAL_HOLD_ACTIVE',
      }, { status: 403 });
    }

    // Check if already restored
    if (record.status === 'restored') {
      return NextResponse.json({
        error: 'Item has already been restored',
        code: 'ALREADY_RESTORED',
      }, { status: 400 });
    }

    // Parse the stored content
    const content = record.content;
    if (!content) {
      return NextResponse.json({
        error: 'No content available to restore',
        code: 'NO_CONTENT',
      }, { status: 400 });
    }

    let restoredTo: string | undefined;

    // Restore based on object type
    switch (record.objectType) {
      case 'transaction': {
        const originalData = content.originalTransaction;
        if (originalData) {
          // Get a default account for the organization
          const defaultAccount = await prisma.financialAccount.findFirst({
            where: { organizationId: session.user.organizationId },
          });

          if (!defaultAccount) {
            return NextResponse.json({
              error: 'No financial account found to restore transaction',
              code: 'NO_ACCOUNT',
            }, { status: 400 });
          }

          // Create new transaction from archived data
          const newTransaction = await prisma.transaction.create({
            data: {
              description: originalData.description || record.title,
              amount: record.amount || originalData.amount || 0,
              currency: record.currency || originalData.currency || 'USD',
              date: originalData.date ? new Date(originalData.date) : new Date(),
              type: originalData.type || 'expense',
              category: originalData.category || record.subcategory || 'general',
              status: 'pending', // Reset to pending status
              organizationId: session.user.organizationId,
              accountId: originalData.accountId || defaultAccount.id,
            },
          });
          restoredTo = `/dashboard/transactions?id=${newTransaction.id}`;
        }
        break;
      }

      case 'invoice': {
        const originalData = content.originalInvoice;
        if (originalData) {
          const newInvoice = await prisma.invoice.create({
            data: {
              invoiceNumber: `RESTORED-${Date.now()}`,
              status: 'draft',
              dueDate: originalData.dueDate ? new Date(originalData.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              invoiceDate: new Date(),
              subtotal: record.amount || originalData.subtotal || 0,
              taxAmount: originalData.taxAmount || 0,
              taxRate: originalData.taxRate || 0,
              total: record.amount || originalData.total || originalData.totalAmount || 0,
              currency: record.currency || originalData.currency || 'USD',
              notes: `Restored from archive: ${record.archiveRecordId}`,
              items: originalData.items || [],
              organizationId: session.user.organizationId,
              customerId: originalData.customerId || undefined,
            },
          });
          restoredTo = `/dashboard/invoices?id=${newInvoice.id}`;
        }
        break;
      }

      case 'order': {
        const originalData = content.originalOrder;
        if (originalData) {
          const total = record.amount || originalData.total || originalData.totalAmount || 0;
          const newOrder = await prisma.order.create({
            data: {
              orderNumber: `RESTORED-${Date.now()}`,
              status: 'draft',
              total: total,
              subtotal: originalData.subtotal || total,
              taxAmount: originalData.taxAmount || 0,
              currency: record.currency || originalData.currency || 'EUR',
              orderDate: new Date(),
              notes: `Restored from archive: ${record.archiveRecordId}`,
              organizationId: session.user.organizationId,
              customerId: originalData.customerId || undefined,
              customerName: originalData.customerName || record.counterpartyName || 'Unknown Customer',
              items: originalData.items || [],
              userId: session.user.id,
            },
          });
          restoredTo = `/dashboard/orders?id=${newOrder.id}`;
        }
        break;
      }

      case 'project': {
        const originalData = content.originalProject;
        if (originalData) {
          const startDate = originalData.plannedStartDate ? new Date(originalData.plannedStartDate) : new Date();
          const endDate = originalData.plannedEndDate ? new Date(originalData.plannedEndDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
          const newProject = await prisma.project.create({
            data: {
              code: originalData.code || `RESTORED-${Date.now()}`,
              name: originalData.name || record.title,
              description: originalData.description || record.description || `Restored from archive: ${record.archiveRecordId}`,
              status: 'planning',
              budgetAmount: record.amount || originalData.budgetAmount || originalData.budget || 0,
              currency: record.currency || originalData.currency || 'EUR',
              plannedStartDate: startDate,
              plannedEndDate: endDate,
              organizationId: session.user.organizationId,
              ownerId: session.user.id,
            },
          });
          restoredTo = `/dashboard/projects?id=${newProject.id}`;
        }
        break;
      }

      default:
        // For other types, we can't directly restore - provide the data for manual restoration
        restoredTo = undefined;
    }

    // Update archive record status
    await (prisma as any).archiveRecord.update({
      where: { id },
      data: {
        status: 'restored',
        lastAccessedAt: new Date(),
        lastAccessedBy: session.user.id,
      },
    });

    // Log the restore action
    await (prisma as any).archiveAccessLog.create({
      data: {
        archiveRecordId: id,
        accessType: 'restore',
        accessScope: 'full',
        actorId: session.user.id,
        actorName: session.user.name || session.user.email,
        actorType: 'user',
        accessGranted: true,
        context: JSON.stringify({ restoredTo }),
      },
    });

    return NextResponse.json({
      success: true,
      restoredTo,
      message: restoredTo
        ? `Item restored successfully`
        : 'Archive marked as restored. Manual restoration required for this object type.',
    });
  } catch (error) {
    console.error('Error restoring archive:', error);
    return NextResponse.json(
        { error: 'Failed to restore archive' },
        { status: 500 }
    );
  }
}
