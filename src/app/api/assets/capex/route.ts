// src/app/api/assets/capex/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/assets/capex
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { searchParams } = new URL(req.url)
  const fiscalYear = searchParams.get('fiscalYear')
  const status = searchParams.get('status')
  
  const where: any = { organizationId: user.organizationId }
  if (fiscalYear) where.fiscalYear = fiscalYear
  if (status) where.status = status
  
  const budgets = await prisma.capExBudget.findMany({
    where,
    include: {
      items: { orderBy: { createdAt: 'desc' } }
    },
    orderBy: { fiscalYear: 'desc' }
  })
  
  return NextResponse.json(budgets)
}

// POST /api/assets/capex
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const {
    name,
    fiscalYear,
    description,
    entityId,
    entityName,
    projectId,
    projectName,
    costCenterId,
    currency,
    budgetAmount,
    notes,
  } = body
  
  if (!name || !fiscalYear || budgetAmount === undefined) {
    return badRequest('Missing required fields: name, fiscalYear, budgetAmount')
  }
  
  const budget = await prisma.capExBudget.create({
    data: {
      name,
      fiscalYear,
      description,
      entityId,
      entityName,
      projectId,
      projectName,
      costCenterId,
      currency: currency || 'EUR',
      budgetAmount,
      remainingAmount: budgetAmount,
      notes,
      organizationId: user.organizationId,
    }
  })
  
  return NextResponse.json(budget, { status: 201 })
}