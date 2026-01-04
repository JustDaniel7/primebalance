// =============================================================================
// SUPPLIER ADDRESS SYNC API
// src/app/api/suppliers/[id]/sync-address/route.ts
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
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionWithOrg();
    if (!user?.organizationId) return unauthorized();

    const { id: supplierId } = await params;
    const body: AddressSyncRequest = await request.json();

    if (!body.address) {
      return badRequest('Address is required');
    }

    // Verify supplier exists and belongs to org
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: supplierId,
        organizationId: user.organizationId,
      },
    });

    if (!supplier) return notFound('Supplier');

    let ordersUpdated = 0;

    // Build the address object
    const supplierAddress = {
      street: body.address.street || '',
      city: body.address.city || '',
      state: body.address.state || '',
      postalCode: body.address.postalCode || '',
      country: body.address.country || '',
    };

    // Update all pending/confirmed purchase orders for this supplier
    const orderResult = await prisma.order.updateMany({
      where: {
        supplierId: supplierId,
        organizationId: user.organizationId,
        status: { in: ['pending', 'confirmed', 'in_production'] },
      },
      data: {
        billingAddress: supplierAddress,
        updatedAt: new Date(),
      },
    });
    ordersUpdated = orderResult.count;

    // Update the supplier's address as well
    await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        address: supplierAddress,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Address synced to ${ordersUpdated} purchase orders`,
      ordersUpdated,
      supplierId,
    });
  } catch (error) {
    console.error('Error syncing address:', error);
    return NextResponse.json(
      { error: 'Failed to sync address' },
      { status: 500 }
    );
  }
}
