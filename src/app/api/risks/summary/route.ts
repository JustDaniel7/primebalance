// src/app/api/risks/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const orgId = user.organizationId;
  const today = new Date();

  const risks = await prisma.risk.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      status: true,
      severity: true,
      impactScore: true,
      isNewlyEscalated: true,
      isStale: true,
      isMitigationOverdue: true,
      targetMitigationDate: true,
    },
  });

  const byStatus: Record<string, number> = {
    identified: 0,
    assessing: 0,
    mitigating: 0,
    monitoring: 0,
    resolved: 0,
    accepted: 0,
    escalated: 0,
  };

  const bySeverity: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  let criticalCount = 0;
  let highCount = 0;
  let newlyEscalated = 0;
  let staleCount = 0;
  let mitigationOverdue = 0;
  let totalImpactScore = 0;

  risks.forEach((risk) => {
    byStatus[risk.status] = (byStatus[risk.status] || 0) + 1;
    bySeverity[risk.severity] = (bySeverity[risk.severity] || 0) + 1;

    if (risk.severity === 'critical') criticalCount++;
    if (risk.severity === 'high') highCount++;
    if (risk.isNewlyEscalated) newlyEscalated++;
    if (risk.isStale) staleCount++;
    if (risk.isMitigationOverdue || (risk.targetMitigationDate && new Date(risk.targetMitigationDate) < today)) {
      mitigationOverdue++;
    }
    totalImpactScore += risk.impactScore;
  });

  const summary = {
    total: risks.length,
    byStatus,
    bySeverity,
    criticalCount,
    highCount,
    newlyEscalated,
    staleCount,
    mitigationOverdue,
    averageImpactScore: risks.length > 0 ? Math.round(totalImpactScore / risks.length) : 0,
  };

  return NextResponse.json(summary);
}