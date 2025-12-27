// src/app/api/chargebacks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

// GET /api/chargebacks/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const chargeback = await prisma.internalChargeback.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      fromCostCenter: { select: { id: true, code: true, name: true } },
      toCostCenter: { select: { id: true, code: true, name: true } },
      project: { select: { id: true, code: true, name: true } },
    },
  });

  if (!chargeback) return notFound('Chargeback');

  return NextResponse.json(chargeback);
}

// PATCH /api/chargebacks/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.internalChargeback.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Chargeback');

  // Prevent editing paid chargebacks
  if (existing.status === 'paid' && !body.forceUpdate) {
    return badRequest('Cannot modify paid chargebacks');
  }

  const updateData: Record<string, unknown> = {};

  // Basic fields
  if (body.description !== undefined) updateData.description = body.description;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.amount !== undefined) updateData.amount = body.amount;
  if (body.notes !== undefined) updateData.notes = body.notes;

  // Allocation
  if (body.allocationMethod !== undefined) updateData.allocationMethod = body.allocationMethod;
  if (body.allocationBasis !== undefined) updateData.allocationBasis = body.allocationBasis;
  if (body.quantity !== undefined) updateData.quantity = body.quantity;
  if (body.unitRate !== undefined) updateData.unitRate = body.unitRate;

  // Status changes
  if (body.status !== undefined) {
    updateData.status = body.status;

    if (body.status === 'approved') {
      updateData.approvedBy = user.name || user.id;
      updateData.approvedAt = new Date();
    } else if (body.status === 'rejected') {
      updateData.rejectionReason = body.rejectionReason;
    }
  }

  const updated = await prisma.internalChargeback.update({
    where: { id },
    data: updateData,
    include: {
      fromCostCenter: { select: { id: true, code: true, name: true } },
      toCostCenter: { select: { id: true, code: true, name: true } },
    },
  });

  // Update cost center budgets on approval
  if (body.status === 'approved' && existing.status !== 'approved') {
    const amount = Number(existing.amount);

    // Debit from source cost center
    await prisma.costCenter.update({
      where: { id: existing.fromCostCenterId },
      data: { budgetSpent: { decrement: amount } },
    });

    // Credit to target cost center
    await prisma.costCenter.update({
      where: { id: existing.toCostCenterId },
      data: { budgetSpent: { increment: amount } },
    });
  }

  return NextResponse.json(updated);
}

// DELETE /api/chargebacks/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const existing = await prisma.internalChargeback.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Chargeback');

  if (['approved', 'billed', 'paid'].includes(existing.status)) {
    return badRequest('Cannot delete approved, billed, or paid chargebacks');
  }

  await prisma.internalChargeback.delete({ where: { id } });

  return NextResponse.json({ success: true });
}