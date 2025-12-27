// src/app/api/scenarios/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: scenarioId } = await params;

  const comments = await prisma.scenarioComment.findMany({
    where: { scenarioId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { id: scenarioId } = await params;
  const body = await req.json();

  if (!body.content) return badRequest('Comment content is required');

  // Verify scenario
  const scenario = await prisma.scenario.findFirst({
    where: { id: scenarioId, organizationId: user.organizationId },
  });
  if (!scenario) return notFound('Scenario');

  const comment = await prisma.scenarioComment.create({
    data: {
      scenarioId,
      content: body.content,
      authorId: user.id,
      authorName: user.name || 'Unknown',
      parentId: body.parentId,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}