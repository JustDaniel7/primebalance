// src/app/api/offers/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const templates = await prisma.offerTemplate.findMany({
    where: { organizationId: user.organizationId, isActive: true },
    orderBy: { usageCount: 'desc' },
  });

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.name) {
    return badRequest('Template name is required');
  }

  const template = await prisma.offerTemplate.create({
    data: {
      name: body.name,
      description: body.description,
      category: body.category,
      defaultCurrency: body.defaultCurrency || 'EUR',
      defaultValidityDays: body.defaultValidityDays || 30,
      defaultPaymentTerms: body.defaultPaymentTerms || 'net_30',
      defaultDeliveryTerms: body.defaultDeliveryTerms,
      defaultTermsAndConditions: body.defaultTermsAndConditions,
      defaultDisclaimer: body.defaultDisclaimer || 'This offer is non-binding.',
      defaultLineItems: body.defaultLineItems || [],
      headerText: body.headerText,
      footerText: body.footerText,
      createdBy: user.name || user.id,
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(template, { status: 201 });
}