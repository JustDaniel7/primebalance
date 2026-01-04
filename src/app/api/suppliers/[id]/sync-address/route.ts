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

    // Build the address object
    const supplierAddress = {
      street: body.address.street || '',
      city: body.address.city || '',
      state: body.address.state || '',
      postalCode: body.address.postalCode || '',
      country: body.address.country || '',
    };

    // Update the supplier's address
    await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        address: supplierAddress,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Supplier address updated successfully',
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
