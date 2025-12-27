// src/app/api/cost-centers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

// GET /api/cost-centers/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const costCenter = await prisma.costCenter.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      parent: { select: { id: true, code: true, name: true } },
      children: { select: { id: true, code: true, name: true, isActive: true } },
      projects: {
        select: { id: true, code: true, name: true, status: true, budgetAmount: true, budgetSpent: true },
      },
      timeEntries: {
        take: 20,
        orderBy: { date: 'desc' },
      },
      chargebacksFrom: {
        take: 10,
        orderBy: { date: 'desc' },
        include: { toCostCenter: { select: { code: true, name: true } } },
      },
      chargebacksTo: {
        take: 10,
        orderBy: { date: 'desc' },
        include: { fromCostCenter: { select: { code: true, name: true } } },
      },
    },
  });

  if (!costCenter) return notFound('Cost Center');

  return NextResponse.json({
    ...costCenter,
    budgetRemaining: Number(costCenter.annualBudget) - Number(costCenter.budgetSpent),
    budgetUtilization: Number(costCenter.annualBudget) > 0
      ? (Number(costCenter.budgetSpent) / Number(costCenter.annualBudget)) * 100
      : 0,
  });
}

// PATCH /api/cost-centers/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.costCenter.findFirst({
    where: { id, organizationId: user.organizationId },
  });

  if (!existing) return notFound('Cost Center');

  const updateData: Record<string, unknown> = {};

  // Basic fields
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.managerId !== undefined) updateData.managerId = body.managerId;
  if (body.managerName !== undefined) updateData.managerName = body.managerName;
  if (body.allocationMethod !== undefined) updateData.allocationMethod = body.allocationMethod;
  if (body.allocationBasis !== undefined) updateData.allocationBasis = body.allocationBasis;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.tags !== undefined) updateData.tags = body.tags;

  // Budget
  if (body.annualBudget !== undefined) {
    updateData.annualBudget = body.annualBudget;
    updateData.budgetRemaining = body.annualBudget - Number(existing.budgetSpent);
    updateData.budgetUtilization = body.annualBudget > 0
      ? (Number(existing.budgetSpent) / body.annualBudget) * 100
      : 0;
  }

  if (body.budgetSpent !== undefined) {
    updateData.budgetSpent = body.budgetSpent;
    updateData.budgetRemaining = Number(existing.annualBudget) - body.budgetSpent;
    updateData.budgetUtilization = Number(existing.annualBudget) > 0
      ? (body.budgetSpent / Number(existing.annualBudget)) * 100
      : 0;
  }

  // Dates
  if (body.effectiveFrom !== undefined) updateData.effectiveFrom = new Date(body.effectiveFrom);
  if (body.effectiveTo !== undefined) updateData.effectiveTo = body.effectiveTo ? new Date(body.effectiveTo) : null;

  const updated = await prisma.costCenter.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

// DELETE /api/cost-centers/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const existing = await prisma.costCenter.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      children: { select: { id: true } },
      projects: { select: { id: true } },
    },
  });

  if (!existing) return notFound('Cost Center');

  // Check for dependencies
  if (existing.children.length > 0) {
    return badRequest('Cannot delete cost center with child cost centers');
  }

  if (existing.projects.length > 0) {
    return badRequest('Cannot delete cost center with linked projects');
  }

  await prisma.costCenter.delete({ where: { id } });

  return NextResponse.json({ success: true });
}