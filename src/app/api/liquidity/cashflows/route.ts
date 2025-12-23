// src/app/api/liquidity/cashflows/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const confidence = searchParams.get('confidence');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (type) where.type = type;
  if (category) where.category = category;
  if (confidence) where.confidence = confidence;
  if (startDate || endDate) {
    where.expectedDate = {};
    if (startDate) (where.expectedDate as any).gte = new Date(startDate);
    if (endDate) (where.expectedDate as any).lte = new Date(endDate);
  }

  const cashflows = await prisma.cashflowItem.findMany({
    where,
    orderBy: { expectedDate: 'asc' },
  });

  return NextResponse.json({ cashflows });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.type || !body.category || !body.description || !body.amount || !body.expectedDate) {
    return badRequest('type, category, description, amount, and expectedDate are required');
  }

  const cashflow = await prisma.cashflowItem.create({
    data: {
      type: body.type,
      category: body.category,
      description: body.description,
      amount: body.amount,
      currency: body.currency || 'EUR',
      expectedDate: new Date(body.expectedDate),
      confidence: body.confidence || 'expected',
      sourceType: body.sourceType || 'manual',
      sourceReference: body.sourceReference,
      sourceDocument: body.sourceDocument,
      counterparty: body.counterparty,
      entityId: body.entityId,
      entityName: body.entityName,
      isRecurring: body.isRecurring || false,
      recurrencePattern: body.recurrencePattern,
      notes: body.notes,
      createdBy: user.name || user.id,
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(cashflow, { status: 201 });
}