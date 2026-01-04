// =============================================================================
// CUSTOMER ADDRESS SYNC API
// src/app/api/customers/[id]/sync-address/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

interface AddressSyncRequest {
  address: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  syncTo: ('invoices' | 'orders')[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionWithOrg();
    if (!user?.organizationId) return unauthorized();

    const { id: customerId } = await params;
    const body: AddressSyncRequest = await request.json();

    if (!body.address) {
      return badRequest('Address is required');
    }

    // Verify customer exists and belongs to org
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId: user.organizationId,
      },
    });

    if (!customer) return notFound('Customer');

    let invoicesUpdated = 0;
    let ordersUpdated = 0;

    // Build the recipient address object for invoices
    const recipientAddress = {
      street: body.address.street || '',
      city: body.address.city || '',
      state: body.address.state || '',
      postalCode: body.address.postalCode || '',
      country: body.address.country || '',
    };

    // Sync to invoices
    if (body.syncTo.includes('invoices')) {
      // Update all draft/pending invoices for this customer
      const invoiceResult = await prisma.invoice.updateMany({
        where: {
          customerId: customerId,
          organizationId: user.organizationId,
          status: { in: ['draft', 'pending'] },
        },
        data: {
          recipient: {
            name: customer.name,
            email: customer.email,
            address: recipientAddress,
          },
          updatedAt: new Date(),
        },
      });
      invoicesUpdated = invoiceResult.count;
    }

    // Sync to orders
    if (body.syncTo.includes('orders')) {
      // Update all pending/confirmed orders for this customer
      const orderResult = await prisma.order.updateMany({
        where: {
          customerId: customerId,
          organizationId: user.organizationId,
          status: { in: ['pending', 'confirmed', 'in_production'] },
        },
        data: {
          shippingAddress: recipientAddress,
          updatedAt: new Date(),
        },
      });
      ordersUpdated = orderResult.count;
    }

    // Update the customer's address as well
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        address: recipientAddress,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Address synced to ${invoicesUpdated} invoices and ${ordersUpdated} orders`,
      invoicesUpdated,
      ordersUpdated,
      customerId,
    });
  } catch (error) {
    console.error('Error syncing address:', error);
    return NextResponse.json(
      { error: 'Failed to sync address' },
      { status: 500 }
    );
  }
}
