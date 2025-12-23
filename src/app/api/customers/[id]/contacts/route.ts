import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils'

// GET /api/customers/[id]/contacts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!customer) return notFound('Customer not found')

  const contacts = await prisma.customerContact.findMany({
    where: { customerId: id },
    orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
  })

  return NextResponse.json({ contacts })
}

// POST /api/customers/[id]/contacts
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

  const { name, title, email, phone, isPrimary = false, role = 'general', notes } = body

  if (!name || !email) {
    return badRequest('Name and email are required')
  }

  if (isPrimary) {
    await prisma.customerContact.updateMany({
      where: { customerId: id, isPrimary: true },
      data: { isPrimary: false },
    })
  }

  const contact = await prisma.customerContact.create({
    data: {
      customerId: id,
      name,
      title,
      email,
      phone,
      isPrimary,
      role,
      notes,
    },
  })

  return NextResponse.json(contact, { status: 201 })
}