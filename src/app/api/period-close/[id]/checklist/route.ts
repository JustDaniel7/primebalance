import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils'

// =============================================================================
// SECTION 3: src/app/api/period-close/[id]/checklist/route.ts
// =============================================================================

// GET /api/period-close/[id]/checklist
export async function GET_CHECKLIST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!period) return notFound('Period not found')

  const items = await prisma.closeChecklistItem.findMany({
    where: { periodId: id },
    orderBy: { orderIndex: 'asc' },
  })

  return NextResponse.json({ checklistItems: items })
}

// POST /api/period-close/[id]/checklist - Initialize from template or add item
export async function POST_CHECKLIST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params
  const body = await req.json()

  const period = await prisma.accountingPeriod.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!period) return notFound('Period not found')

  if (body.template === 'monthly-standard') {
    const standardItems = [
      { name: 'Bank Reconciliation', category: 'reconciliation', orderIndex: 1, isRequired: true, isCritical: true, isAutomated: false },
      { name: 'Credit Card Reconciliation', category: 'reconciliation', orderIndex: 2, isRequired: true, isCritical: false, isAutomated: false },
      { name: 'Accounts Receivable Aging Review', category: 'review', orderIndex: 3, isRequired: true, isCritical: false, isAutomated: true },
      { name: 'Accounts Payable Review', category: 'review', orderIndex: 4, isRequired: true, isCritical: false, isAutomated: true },
      { name: 'Inventory Count Verification', category: 'reconciliation', orderIndex: 5, isRequired: false, isCritical: false, isAutomated: false },
      { name: 'Prepaid Expenses Amortization', category: 'adjustment', orderIndex: 6, isRequired: true, isCritical: false, isAutomated: true },
      { name: 'Depreciation Entry', category: 'adjustment', orderIndex: 7, isRequired: true, isCritical: false, isAutomated: true },
      { name: 'Accrued Expenses Review', category: 'adjustment', orderIndex: 8, isRequired: true, isCritical: false, isAutomated: false },
      { name: 'Revenue Recognition Review', category: 'review', orderIndex: 9, isRequired: true, isCritical: true, isAutomated: false },
      { name: 'Intercompany Reconciliation', category: 'reconciliation', orderIndex: 10, isRequired: false, isCritical: false, isAutomated: false },
      { name: 'Trial Balance Review', category: 'review', orderIndex: 11, isRequired: true, isCritical: true, isAutomated: true },
      { name: 'Financial Statements Generation', category: 'system', orderIndex: 12, isRequired: true, isCritical: true, isAutomated: true },
      { name: 'Management Approval', category: 'approval', orderIndex: 13, isRequired: true, isCritical: true, isAutomated: false },
    ]

    await prisma.closeChecklistItem.deleteMany({ where: { periodId: id } })

    await prisma.closeChecklistItem.createMany({
      data: standardItems.map((item) => ({
        periodId: id,
        ...item,
        status: 'pending',
      })),
    })

    await prisma.accountingPeriod.update({
      where: { id },
      data: {
        checklistTotal: standardItems.length,
        checklistCompleted: 0,
        checklistProgress: 0,
      },
    })

    const items = await prisma.closeChecklistItem.findMany({
      where: { periodId: id },
      orderBy: { orderIndex: 'asc' },
    })

    return NextResponse.json({ checklistItems: items }, { status: 201 })
  }

  const { name, description, category, orderIndex, isRequired, isCritical, isAutomated, dependsOn } = body

  if (!name || !category) {
    return badRequest('Name and category are required')
  }

  const item = await prisma.closeChecklistItem.create({
    data: {
      periodId: id,
      name,
      description,
      category,
      orderIndex: orderIndex || 0,
      isRequired: isRequired ?? true,
      isCritical: isCritical ?? false,
      isAutomated: isAutomated ?? false,
      dependsOn: dependsOn || [],
      status: 'pending',
    },
  })

  const count = await prisma.closeChecklistItem.count({ where: { periodId: id } })
  await prisma.accountingPeriod.update({
    where: { id },
    data: { checklistTotal: count },
  })

  return NextResponse.json(item, { status: 201 })
}
