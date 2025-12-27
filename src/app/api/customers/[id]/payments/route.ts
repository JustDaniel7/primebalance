import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

// GET /api/customers/[id]/payments
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
  })
  if (!customer) return notFound('Customer not found')

  const where: Record<string, unknown> = { customerId: id }
  if (status && status !== 'all') where.status = status

  const payments = await prisma.customerPayment.findMany({
    where,
    orderBy: { invoiceDate: 'desc' },
  })

  return NextResponse.json({ payments })
}