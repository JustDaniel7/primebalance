// src/app/api/assets/capex/[id]/items/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils'

// GET /api/assets/capex/[id]/items
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  const {id} = await params;
  const budget = await prisma.capExBudget.findFirst({
    where: { id: id, organizationId: user.organizationId }
  })
  if (!budget) return notFound('CapEx budget not found')
  
  const items = await prisma.capExItem.findMany({
    where: { budgetId: id },
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json(items)
}

// POST /api/assets/capex/[id]/items
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  const {id} = await params;
  const budget = await prisma.capExBudget.findFirst({
    where: { id: id, organizationId: user.organizationId }
  })
  if (!budget) return notFound('CapEx budget not found')
  
  const body = await req.json()
  const {
    description,
    category,
    estimatedAmount,
    actualAmount,
    status,
    classification,
    classificationReason,
    assetId,
    plannedDate,
    notes,
  } = body
  
  if (!description || estimatedAmount === undefined) {
    return badRequest('Missing required fields: description, estimatedAmount')
  }
  
  const item = await prisma.capExItem.create({
    data: {
      description,
      category,
      estimatedAmount,
      actualAmount,
      variance: actualAmount ? Number(actualAmount) - Number(estimatedAmount) : null,
      status: status || 'planned',
      classification: classification || 'capex',
      classificationReason,
      assetId,
      plannedDate: plannedDate ? new Date(plannedDate) : null,
      notes,
      budgetId: id,
    }
  })
  
  // Update budget amounts
  const allItems = await prisma.capExItem.findMany({
    where: { budgetId: id }
  })
  
  const committed = allItems
    .filter(i => ['approved', 'committed'].includes(i.status))
    .reduce((sum, i) => sum + Number(i.estimatedAmount), 0)
  
  const spent = allItems
    .filter(i => i.status === 'spent' && i.actualAmount)
    .reduce((sum, i) => sum + Number(i.actualAmount), 0)
  
  const remaining = Number(budget.budgetAmount) - spent
  const utilization = Number(budget.budgetAmount) > 0 
    ? (spent / Number(budget.budgetAmount)) * 100 
    : 0
  
  await prisma.capExBudget.update({
    where: { id: id },
    data: {
      committedAmount: committed,
      spentAmount: spent,
      remainingAmount: remaining,
      utilizationPercent: utilization,
      status: remaining < 0 ? 'overspent' : budget.status,
    }
  })
  
  return NextResponse.json(item, { status: 201 })
}