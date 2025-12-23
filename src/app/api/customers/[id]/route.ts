import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

// GET /api/customers/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      contacts: { orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }] },
      payments: { orderBy: { invoiceDate: 'desc' }, take: 20 },
      creditEvents: { orderBy: { createdAt: 'desc' }, take: 10 },
      revenueRecords: { orderBy: { period: 'desc' } },
      riskIndicators: { orderBy: [{ status: 'asc' }, { severity: 'desc' }] },
    },
  })

  if (!customer) return notFound('Customer not found')

  return NextResponse.json(customer)
}

// PATCH /api/customers/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params
  const body = await req.json()

  const current = await prisma.customer.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!current) return notFound('Customer not found')

  // Handle credit limit changes
  if (body.creditLimit !== undefined && body.creditLimit !== Number(current.creditLimit)) {
    const newLimit = body.creditLimit
    const creditUsed = Number(current.creditUsed)
    body.creditAvailable = Math.max(0, newLimit - creditUsed)

    await prisma.customerCreditEvent.create({
      data: {
        customerId: id,
        type: newLimit > Number(current.creditLimit) ? 'limit_increase' : 'limit_decrease',
        previousValue: current.creditLimit.toString(),
        newValue: newLimit.toString(),
        reason: body.creditChangeReason || 'Credit limit adjusted',
        changedBy: user.id,
        changedByName: user.name || undefined,
        organizationId: user.organizationId,
      },
    })
    delete body.creditChangeReason
  }

  // Handle credit status changes
  if (body.creditStatus && body.creditStatus !== current.creditStatus) {
    await prisma.customerCreditEvent.create({
      data: {
        customerId: id,
        type: 'status_change',
        previousValue: current.creditStatus,
        newValue: body.creditStatus,
        reason: body.statusChangeReason || 'Credit status updated',
        changedBy: user.id,
        changedByName: user.name || undefined,
        organizationId: user.organizationId,
      },
    })
    delete body.statusChangeReason
  }

  const result = await prisma.customer.update({
    where: { id },
    data: body,
    include: {
      contacts: true,
      _count: { select: { payments: true, riskIndicators: true } },
    },
  })

  return NextResponse.json(result)
}

// DELETE /api/customers/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params

  const result = await prisma.customer.deleteMany({
    where: { id, organizationId: user.organizationId },
  })

  if (result.count === 0) return notFound('Customer not found')

  return NextResponse.json({ success: true })
}