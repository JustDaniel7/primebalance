// src/app/api/netting/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const agreementId = searchParams.get('agreementId');

  const where: Record<string, unknown> = { organizationId: user.organizationId };
  if (status) where.status = status;
  if (agreementId) where.agreementId = agreementId;

  const sessions = await prisma.nettingSession.findMany({
    where,
    include: {
      agreement: { select: { name: true, agreementNumber: true } },
      positions: { include: { transactions: true } },
      settlements: true,
    },
    orderBy: { nettingDate: 'desc' },
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();

  if (!body.agreementId || !body.periodStart || !body.periodEnd || !body.nettingDate) {
    return badRequest('agreementId, periodStart, periodEnd, and nettingDate are required');
  }

  // Verify agreement exists
  const agreement = await prisma.nettingAgreement.findFirst({
    where: { id: body.agreementId, organizationId: user.organizationId },
  });

  if (!agreement) return badRequest('Agreement not found');

  // Generate session number
  const year = new Date().getFullYear();
  const prefix = agreement.type === 'intercompany' ? 'IC-' : '';
  const count = await prisma.nettingSession.count({
    where: { organizationId: user.organizationId },
  });
  const sessionNumber = `NS-${year}-${prefix}${String(count + 1).padStart(3, '0')}`;

  // Calculate settlement date
  const nettingDate = new Date(body.nettingDate);
  const settlementDate = new Date(nettingDate);
  settlementDate.setDate(settlementDate.getDate() + agreement.settlementDays);

  const session = await prisma.nettingSession.create({
    data: {
      sessionNumber,
      type: agreement.type,
      status: 'draft',
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
      nettingDate,
      settlementDate,
      baseCurrency: agreement.baseCurrency,
      totalReceivables: body.totalReceivables || 0,
      totalPayables: body.totalPayables || 0,
      grossAmount: body.grossAmount || 0,
      netAmount: body.netAmount || 0,
      savingsAmount: body.savingsAmount || 0,
      savingsPercentage: body.savingsPercentage || 0,
      createdById: user.id,
      createdByName: user.name,
      notes: body.notes,
      agreementId: body.agreementId,
      organizationId: user.organizationId,
    },
    include: { agreement: true },
  });

  return NextResponse.json(session, { status: 201 });
}