import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils'

// GET /api/customers/[id]/credit
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: user.organizationId },
    select: {
      id: true,
      creditLimit: true,
      creditUsed: true,
      creditAvailable: true,
      creditStatus: true,
      paymentTerms: true,
    },
  })
  if (!customer) return notFound('Customer not found')

  const creditEvents = await prisma.customerCreditEvent.findMany({
    where: { customerId: id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({ credit: customer, events: creditEvents })
}

// POST /api/customers/[id]/credit
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

  const { type, newValue, reason } = body

  if (!type || !newValue || !reason) {
    return badRequest('Type, newValue, and reason are required')
  }

  let previousValue: string | undefined
  const updateData: Record<string, unknown> = {}

  switch (type) {
    case 'limit_increase':
    case 'limit_decrease':
      previousValue = customer.creditLimit.toString()
      updateData.creditLimit = parseFloat(newValue)
      updateData.creditAvailable = Math.max(0, parseFloat(newValue) - Number(customer.creditUsed))
      break
    case 'status_change':
      previousValue = customer.creditStatus
      updateData.creditStatus = newValue
      break
    case 'terms_change':
      previousValue = customer.paymentTerms
      updateData.paymentTerms = newValue
      break
  }

  const event = await prisma.customerCreditEvent.create({
    data: {
      customerId: id,
      type,
      previousValue,
      newValue,
      reason,
      changedBy: user.id,
      changedByName: user.name || undefined,
      organizationId: user.organizationId,
    },
  })

  if (Object.keys(updateData).length > 0) {
    await prisma.customer.update({
      where: { id },
      data: updateData,
    })
  }

  return NextResponse.json(event, { status: 201 })
}