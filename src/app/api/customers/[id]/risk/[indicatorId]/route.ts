import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

// PATCH /api/customers/[id]/risk/[indicatorId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; indicatorId: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id, indicatorId } = await params
  const body = await req.json()

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!customer) return notFound('Customer not found')

  const updateData: Record<string, unknown> = { ...body }

  if (body.status === 'resolved') {
    updateData.resolvedAt = new Date()
  }

  const result = await prisma.customerRiskIndicator.update({
    where: { id: indicatorId },
    data: updateData,
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

  return NextResponse.json(result)
}

// DELETE /api/customers/[id]/risk/[indicatorId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; indicatorId: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id, indicatorId } = await params

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!customer) return notFound('Customer not found')

  await prisma.customerRiskIndicator.delete({ where: { id: indicatorId } })

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

  return NextResponse.json({ success: true })
}