// src/app/api/period-close/[id]/checklist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

// GET /api/period-close/[id]/checklist
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!period) return notFound('Period');

  const items = await prisma.closeChecklistItem.findMany({
    where: { periodId: id },
    orderBy: { orderIndex: 'asc' },
  });

  return NextResponse.json({ checklistItems: items });
}

// POST /api/period-close/[id]/checklist - Initialize from template or add item
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!period) return notFound('Period');

  // Initialize from template
  if (body.template) {
    const templates: Record<string, any[]> = {
      'monthly-standard': [
        { name: 'Bank Reconciliation', category: 'reconciliation', orderIndex: 1, isRequired: true, isCritical: true, isAutomated: false },
        { name: 'Credit Card Reconciliation', category: 'reconciliation', orderIndex: 2, isRequired: true, isCritical: false, isAutomated: false },
        { name: 'Accounts Receivable Aging Review', category: 'review', orderIndex: 3, isRequired: true, isCritical: false, isAutomated: true },
        { name: 'Accounts Payable Review', category: 'review', orderIndex: 4, isRequired: true, isCritical: false, isAutomated: true },
        { name: 'Inventory Count Verification', category: 'reconciliation', orderIndex: 5, isRequired: false, isCritical: false, isAutomated: false },
        { name: 'Prepaid Expenses Amortization', category: 'adjustment', orderIndex: 6, isRequired: true, isCritical: false, isAutomated: true },
        { name: 'Depreciation Entry', category: 'adjustment', orderIndex: 7, isRequired: true, isCritical: false, isAutomated: true },
        { name: 'Accrued Expenses Review', category: 'adjustment', orderIndex: 8, isRequired: true, isCritical: false, isAutomated: false },
        { name: 'Revenue Recognition Review', category: 'review', orderIndex: 9, isRequired: true, isCritical: true, isAutomated: false },
        { name: 'Intercompany Reconciliation', category: 'reconciliation', orderIndex: 10, isRequired: false, isCritical: false, isAutomated: false },
        { name: 'Trial Balance Review', category: 'review', orderIndex: 11, isRequired: true, isCritical: true, isAutomated: true },
        { name: 'Financial Statements Generation', category: 'system', orderIndex: 12, isRequired: true, isCritical: true, isAutomated: true },
        { name: 'Management Approval', category: 'approval', orderIndex: 13, isRequired: true, isCritical: true, isAutomated: false },
      ],
    };

    const templateItems = templates[body.template];
    if (!templateItems) {
      return badRequest(`Unknown template: ${body.template}`);
    }

    // Delete existing items
    await prisma.closeChecklistItem.deleteMany({ where: { periodId: id } });

    // Create new items
    for (const item of templateItems) {
      await prisma.closeChecklistItem.create({
        data: {
          periodId: id,
          ...item,
          status: 'pending',
          dependsOn: [],
        },
      });
    }

    // Update period totals
    await prisma.accountingPeriod.update({
      where: { id },
      data: {
        checklistTotal: templateItems.length,
        checklistCompleted: 0,
        checklistProgress: 0,
      },
    });

    const items = await prisma.closeChecklistItem.findMany({
      where: { periodId: id },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({ checklistItems: items }, { status: 201 });
  }

  // Add single item
  if (!body.name) {
    return badRequest('name is required');
  }

  const maxOrder = await prisma.closeChecklistItem.aggregate({
    where: { periodId: id },
    _max: { orderIndex: true },
  });

  const item = await prisma.closeChecklistItem.create({
    data: {
      periodId: id,
      name: body.name,
      description: body.description,
      category: body.category || 'review',
      orderIndex: (maxOrder._max.orderIndex || 0) + 1,
      status: 'pending',
      isRequired: body.isRequired ?? true,
      isCritical: body.isCritical ?? false,
      isAutomated: body.isAutomated ?? false,
      automationRule: body.automationRule,
      dependsOn: body.dependsOn || [],
    },
  });

  // Update period total
  await prisma.accountingPeriod.update({
    where: { id },
    data: { checklistTotal: { increment: 1 } },
  });

  return NextResponse.json(item, { status: 201 });
}