import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

// GET /api/customers/[id]/revenue
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const periodType = searchParams.get('periodType')

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!customer) return notFound('Customer not found')

  const where: Record<string, unknown> = { customerId: id }
  if (periodType) where.periodType = periodType

  const revenue = await prisma.customerRevenue.findMany({
    where,
    orderBy: { period: 'desc' },
  })

  return NextResponse.json({ revenue })
}