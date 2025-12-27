// src/app/api/chargebacks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

// GET /api/chargebacks
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const fromCostCenterId = searchParams.get('fromCostCenterId');
  const toCostCenterId = searchParams.get('toCostCenterId');
  const projectId = searchParams.get('projectId');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (status) where.status = status;
  if (fromCostCenterId) where.fromCostCenterId = fromCostCenterId;
  if (toCostCenterId) where.toCostCenterId = toCostCenterId;
  if (projectId) where.projectId = projectId;

  const chargebacks = await prisma.internalChargeback.findMany({
    where,
    include: {
      fromCostCenter: { select: { id: true, code: true, name: true } },
      toCostCenter: { select: { id: true, code: true, name: true } },
      project: { select: { id: true, code: true, name: true } },
    },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({ chargebacks });
}

// POST /api/chargebacks
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.fromCostCenterId) return badRequest('fromCostCenterId is required');
  if (!body.toCostCenterId) return badRequest('toCostCenterId is required');
  if (!body.date) return badRequest('date is required');
  if (!body.description) return badRequest('description is required');
  if (body.amount === undefined) return badRequest('amount is required');
  if (!body.category) return badRequest('category is required');

  // Verify cost centers exist
  const fromCC = await prisma.costCenter.findFirst({
    where: { id: body.fromCostCenterId, organizationId: user.organizationId },
  });
  const toCC = await prisma.costCenter.findFirst({
    where: { id: body.toCostCenterId, organizationId: user.organizationId },
  });

  if (!fromCC) return badRequest('From cost center not found');
  if (!toCC) return badRequest('To cost center not found');

  // Generate chargeback number
  const count = await prisma.internalChargeback.count({
    where: { organizationId: user.organizationId },
  });
  const chargebackNumber = `CB-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const chargeback = await prisma.internalChargeback.create({
    data: {
      chargebackNumber,
      fromCostCenterId: body.fromCostCenterId,
      fromCostCenterCode: fromCC.code,
      toCostCenterId: body.toCostCenterId,
      toCostCenterCode: toCC.code,
      projectId: body.projectId,
      projectCode: body.projectCode,
      date: new Date(body.date),
      description: body.description,
      category: body.category,
      amount: body.amount,
      currency: body.currency || 'EUR',
      allocationMethod: body.allocationMethod || 'direct',
      allocationBasis: body.allocationBasis,
      quantity: body.quantity,
      unitRate: body.unitRate,
      periodStart: body.periodStart ? new Date(body.periodStart) : new Date(body.date),
      periodEnd: body.periodEnd ? new Date(body.periodEnd) : new Date(body.date),
      status: 'pending',
      notes: body.notes,
      createdBy: user.name || user.id,
      organizationId: user.organizationId,
    },
    include: {
      fromCostCenter: { select: { id: true, code: true, name: true } },
      toCostCenter: { select: { id: true, code: true, name: true } },
    },
  });

  return NextResponse.json(chargeback, { status: 201 });
}