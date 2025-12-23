// src/app/api/period-close/adjustments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils';

// GET /api/period-close/adjustments
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const periodId = searchParams.get('periodId');
  const status = searchParams.get('status');
  const type = searchParams.get('type');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (periodId) where.periodId = periodId;
  if (status) where.status = status;
  if (type) where.type = type;

  const adjustments = await prisma.periodAdjustment.findMany({
    where,
    include: { period: { select: { name: true, code: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ adjustments });
}

// POST /api/period-close/adjustments
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.periodId || !body.description || !body.reason || body.amount === undefined || !body.effectiveDate) {
    return badRequest('periodId, description, reason, amount, and effectiveDate are required');
  }

  const period = await prisma.accountingPeriod.findFirst({
    where: { id: body.periodId, organizationId: user.organizationId },
  });
  if (!period) return notFound('Period');

  // Generate adjustment number
  const count = await prisma.periodAdjustment.count({
    where: { organizationId: user.organizationId },
  });
  const adjustmentNumber = `ADJ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const adjustment = await prisma.periodAdjustment.create({
    data: {
      periodId: body.periodId,
      adjustmentNumber,
      type: body.type || 'accrual',
      status: 'draft',
      description: body.description,
      reason: body.reason,
      debitAccountId: body.debitAccountId,
      debitAccountName: body.debitAccountName,
      creditAccountId: body.creditAccountId,
      creditAccountName: body.creditAccountName,
      amount: body.amount,
      currency: body.currency || 'EUR',
      effectiveDate: new Date(body.effectiveDate),
      isReversing: body.isReversing || false,
      reversalDate: body.reversalDate ? new Date(body.reversalDate) : null,
      reversalPeriodId: body.reversalPeriodId,
      originalAdjustmentId: body.originalAdjustmentId,
      requestedBy: user.id,
      requestedByName: user.name,
      supportingDocuments: body.supportingDocuments || [],
      notes: body.notes,
      organizationId: user.organizationId,
    },
  });

  // Update period flag
  await prisma.accountingPeriod.update({
    where: { id: body.periodId },
    data: { hasUnapprovedAdjustments: true },
  });

  return NextResponse.json(adjustment, { status: 201 });
}