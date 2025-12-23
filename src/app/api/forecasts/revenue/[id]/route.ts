// src/app/api/forecasts/revenue/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const forecast = await prisma.revenueForecast.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      lineItems: { orderBy: { createdAt: 'asc' } },
      annotations: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!forecast) return notFound('Revenue Forecast');
  return NextResponse.json(forecast);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const result = await prisma.revenueForecast.updateMany({
    where: { id, organizationId: user.organizationId },
    data: { ...body, lastUpdatedBy: user.name || user.id },
  });

  if (result.count === 0) return notFound('Revenue Forecast');

  const updated = await prisma.revenueForecast.findUnique({
    where: { id },
    include: { lineItems: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;

  const result = await prisma.revenueForecast.deleteMany({
    where: { id, organizationId: user.organizationId },
  });

  if (result.count === 0) return notFound('Revenue Forecast');
  return NextResponse.json({ success: true });
}