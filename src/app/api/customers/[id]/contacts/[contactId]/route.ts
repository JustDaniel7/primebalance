import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

// PATCH /api/customers/[id]/contacts/[contactId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id, contactId } = await params
  const body = await req.json()

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!customer) return notFound('Customer not found')

  if (body.isPrimary) {
    await prisma.customerContact.updateMany({
      where: { customerId: id, isPrimary: true, id: { not: contactId } },
      data: { isPrimary: false },
    })
  }

  const result = await prisma.customerContact.update({
    where: { id: contactId },
    data: body,
  })

  return NextResponse.json(result)
}

// DELETE /api/customers/[id]/contacts/[contactId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id, contactId } = await params

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!customer) return notFound('Customer not found')

  await prisma.customerContact.delete({ where: { id: contactId } })

  return NextResponse.json({ success: true })
}