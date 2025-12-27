// src/app/api/cost-centers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

// GET /api/cost-centers - List all cost centers
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const isActive = searchParams.get('isActive');
  const parentId = searchParams.get('parentId');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (isActive !== null) where.isActive = isActive === 'true';
  if (parentId) where.parentId = parentId;

  const costCenters = await prisma.costCenter.findMany({
    where,
    include: {
      parent: { select: { id: true, code: true, name: true } },
      children: { select: { id: true, code: true, name: true } },
      projects: { select: { id: true, code: true, name: true, status: true } },
      _count: { select: { timeEntries: true, chargebacksFrom: true, chargebacksTo: true } },
    },
    orderBy: [{ level: 'asc' }, { code: 'asc' }],
  });

  // Calculate derived fields
  const costCentersWithCalculations = costCenters.map((cc) => ({
    ...cc,
    budgetRemaining: Number(cc.annualBudget) - Number(cc.budgetSpent),
    budgetUtilization: Number(cc.annualBudget) > 0
      ? (Number(cc.budgetSpent) / Number(cc.annualBudget)) * 100
      : 0,
  }));

  return NextResponse.json({ costCenters: costCentersWithCalculations });
}

// POST /api/cost-centers - Create a new cost center
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.name) return badRequest('Name is required');

  // Generate code if not provided
  const code = body.code || `CC-${Date.now().toString().slice(-6)}`;

  // Check for duplicate code
  const existing = await prisma.costCenter.findUnique({
    where: {
      organizationId_code: {
        organizationId: user.organizationId,
        code,
      },
    },
  });

  if (existing) return badRequest('Cost center code already exists');

  // Determine level and path based on parent
  let level = 0;
  let path = code;

  if (body.parentId) {
    const parent = await prisma.costCenter.findUnique({
      where: { id: body.parentId },
    });
    if (parent) {
      level = parent.level + 1;
      path = parent.path ? `${parent.path}/${code}` : code;
    }
  }

  const costCenter = await prisma.costCenter.create({
    data: {
      code,
      name: body.name,
      description: body.description,
      parentId: body.parentId,
      level,
      path,
      managerId: body.managerId,
      managerName: body.managerName,
      annualBudget: body.annualBudget || 0,
      budgetSpent: 0,
      budgetRemaining: body.annualBudget || 0,
      budgetUtilization: 0,
      currency: body.currency || 'EUR',
      allocationMethod: body.allocationMethod || 'direct',
      allocationBasis: body.allocationBasis,
      isActive: body.isActive ?? true,
      effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : new Date(),
      effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : null,
      tags: body.tags || [],
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(costCenter, { status: 201 });
}