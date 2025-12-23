// src/app/api/forecasts/alerts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const result = await prisma.forecastAlert.updateMany({
    where: { id, organizationId: user.organizationId },
    data: body,
  });

  if (result.count === 0) return notFound('Alert');

  const updated = await prisma.forecastAlert.findUnique({ where: { id } });
  return NextResponse.json(updated);
}