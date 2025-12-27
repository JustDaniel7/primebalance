// src/app/api/projects/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils';

// GET /api/projects/summary - Dashboard summary
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const orgId = user.organizationId;

  // Get all projects
  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      type: true,
      status: true,
      budgetAmount: true,
      budgetSpent: true,
      totalRevenue: true,
      totalCosts: true,
      plannedEndDate: true,
    },
  });

  const today = new Date();

  // Status counts
  const byStatus: Record<string, number> = {
    planning: 0,
    active: 0,
    on_hold: 0,
    completed: 0,
    cancelled: 0,
    archived: 0,
  };

  // Type counts
  const byType: Record<string, number> = {
    internal: 0,
    client: 0,
    rd: 0,
    capex: 0,
    opex: 0,
    maintenance: 0,
  };

  let totalBudget = 0;
  let totalSpent = 0;
  let totalRevenue = 0;
  let totalCosts = 0;
  let overdueProjects = 0;
  let overBudgetProjects = 0;

  projects.forEach((p) => {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    byType[p.type] = (byType[p.type] || 0) + 1;

    totalBudget += Number(p.budgetAmount);
    totalSpent += Number(p.budgetSpent);
    totalRevenue += Number(p.totalRevenue);
    totalCosts += Number(p.totalCosts);

    // Check overdue (active projects past planned end date)
    if (p.status === 'active' && p.plannedEndDate && new Date(p.plannedEndDate) < today) {
      overdueProjects++;
    }

    // Check over budget
    if (Number(p.budgetSpent) > Number(p.budgetAmount)) {
      overBudgetProjects++;
    }
  });

  const totalProfit = totalRevenue - totalCosts;
  const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const summary = {
    totalProjects: projects.length,
    activeProjects: byStatus.active,
    completedProjects: byStatus.completed,
    onHoldProjects: byStatus.on_hold,
    totalBudget,
    totalSpent,
    totalRemaining: totalBudget - totalSpent,
    totalRevenue,
    totalCosts,
    totalProfit,
    averageMargin,
    overdueProjects,
    overBudgetProjects,
    byType,
    byStatus,
  };

  return NextResponse.json(summary);
}