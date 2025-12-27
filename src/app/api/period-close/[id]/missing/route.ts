// src/app/api/period-close/[id]/missing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

// GET /api/period-close/[id]/missing
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!period) return notFound('Period');

  const items = await prisma.periodMissingItem.findMany({
    where: { periodId: id },
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ missingItems: items });
}

// POST /api/period-close/[id]/missing
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  if (!body.title || !body.type) {
    return badRequest('title and type are required');
  }

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!period) return notFound('Period');

  const item = await prisma.periodMissingItem.create({
    data: {
      periodId: id,
      type: body.type,
      severity: body.severity || 'medium',
      title: body.title,
      description: body.description || '',
      reference: body.reference,
      relatedEntityType: body.relatedEntityType,
      relatedEntityId: body.relatedEntityId,
      assignedTo: body.assignedTo,
      assignedToName: body.assignedToName,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: 'open',
    },
  });

  // Update period flag
  await prisma.accountingPeriod.update({
    where: { id },
    data: { hasMissingDocuments: true },
  });

  return NextResponse.json(item, { status: 201 });
}