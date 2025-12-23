import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils'

// GET /api/customers/[id]/risk
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: user.organizationId },
    select: { id: true, riskLevel: true, riskScore: true },
  })
  if (!customer) return notFound('Customer not found')

  const where: Record<string, unknown> = { customerId: id }
  if (status && status !== 'all') where.status = status

  const indicators = await prisma.customerRiskIndicator.findMany({
    where,
    orderBy: [{ status: 'asc' }, { severity: 'desc' }],
  })

  return NextResponse.json({ risk: customer, indicators })
}

// POST /api/customers/[id]/risk
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params
  const body = await req.json()

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!customer) return notFound('Customer not found')

  const { category, indicator, description, severity = 'medium', score = 0, recommendedAction } = body

  if (!category || !indicator || !description) {
    return badRequest('Category, indicator, and description are required')
  }

  const riskIndicator = await prisma.customerRiskIndicator.create({
    data: {
      customerId: id,
      category,
      indicator,
      description,
      severity,
      score,
      status: 'active',
      recommendedAction,
    },
  })

  // Recalculate customer risk score
  const activeIndicators = await prisma.customerRiskIndicator.findMany({
    where: { customerId: id, status: 'active' },
  })
  const newScore = Math.min(100, activeIndicators.reduce((sum, r) => sum + r.score, 0))
  const newLevel = newScore >= 70 ? 'critical' : newScore >= 50 ? 'high' : newScore >= 25 ? 'medium' : 'low'

  await prisma.customer.update({
    where: { id },
    data: { riskScore: newScore, riskLevel: newLevel },
  })

  return NextResponse.json(riskIndicator, { status: 201 })
}