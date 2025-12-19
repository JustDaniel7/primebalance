// src/app/api/invoices/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

// GET /api/invoices/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, organizationId: user.organizationId }
  })
  
  if (!invoice) return notFound('Invoice not found')
  
  return NextResponse.json(invoice)
}

// PATCH /api/invoices/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  
  // Convert date strings to Date objects
  if (body.invoiceDate) body.invoiceDate = new Date(body.invoiceDate)
  if (body.dueDate) body.dueDate = new Date(body.dueDate)
  if (body.serviceDate) body.serviceDate = new Date(body.serviceDate)
  if (body.sentAt) body.sentAt = new Date(body.sentAt)
  if (body.paidAt) body.paidAt = new Date(body.paidAt)
  
  const invoice = await prisma.invoice.updateMany({
    where: { id: params.id, organizationId: user.organizationId },
    data: body
  })
  
  if (invoice.count === 0) return notFound('Invoice not found')
  
  const updated = await prisma.invoice.findUnique({ where: { id: params.id } })
  return NextResponse.json(updated)
}

// DELETE /api/invoices/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const result = await prisma.invoice.deleteMany({
    where: { id: params.id, organizationId: user.organizationId }
  })
  
  if (result.count === 0) return notFound('Invoice not found')
  
  return NextResponse.json({ success: true })
}