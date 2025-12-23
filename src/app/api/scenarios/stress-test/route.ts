// src/app/api/scenarios/stress-tests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const templatesOnly = searchParams.get('templates') === 'true';

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (templatesOnly) where.isTemplate = true;

  const stressTests = await prisma.stressTest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ stressTests });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.name) return badRequest('Stress test name is required');

  const stressTest = await prisma.stressTest.create({
    data: {
      name: body.name,
      description: body.description,
      type: body.type || 'combined',
      isTemplate: body.isTemplate || false,
      parameters: body.parameters || [],
      intensity: body.intensity || 'moderate',
      result: 'pass',
      resultMetrics: body.resultMetrics || {},
      thresholds: body.thresholds || [],
      defaultIntensities: body.defaultIntensities,
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(stressTest, { status: 201 });
}