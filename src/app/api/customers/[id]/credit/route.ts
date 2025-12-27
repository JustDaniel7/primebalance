// src/app/api/customers/[id]/credit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: customerId } = await params;
  const body = await req.json();

  if (!body.type || !body.newValue || !body.reason) {
    return badRequest('type, newValue, and reason are required');
  }

  // Verify customer belongs to organization
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId: user.organizationId },
  });
  if (!customer) return notFound('Customer');

  // Get previous value based on type
  let previousValue: string | undefined;
  const customerUpdate: Record<string, unknown> = {};

  if (body.type === 'limit_increase' || body.type === 'limit_decrease') {
    previousValue = customer.creditLimit.toString();
    const newLimit = parseFloat(body.newValue);
    customerUpdate.creditLimit = newLimit;
    customerUpdate.creditAvailable = newLimit - Number(customer.creditUsed);
  } else if (body.type === 'status_change') {
    previousValue = customer.creditStatus;
    customerUpdate.creditStatus = body.newValue;
  } else if (body.type === 'terms_change') {
    previousValue = customer.paymentTerms;
    customerUpdate.paymentTerms = body.newValue;
  }

  // Create credit event
  const creditEvent = await prisma.customerCreditEvent.create({
    data: {
      customerId,
      type: body.type,
      previousValue,
      newValue: body.newValue,
      reason: body.reason,
      changedBy: user.id,
      changedByName: user.name || 'Unknown',
      organizationId: user.organizationId,
    },
  });

  // Update customer
  if (Object.keys(customerUpdate).length > 0) {
    await prisma.customer.update({
      where: { id: customerId },
      data: customerUpdate,
    });
  }

  return NextResponse.json(creditEvent, { status: 201 });
}