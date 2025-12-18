// src/app/api/receivables/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

// GET /api/receivables/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const receivable = await prisma.receivable.findFirst({
    where: { id: params.id, organizationId: user.organizationId },
    include: {
      paymentApplications: { orderBy: { appliedAt: 'desc' } },
      events: { orderBy: { createdAt: 'desc' } }
    }
  })
  
  if (!receivable) return notFound('Receivable not found')
  
  return NextResponse.json(receivable)
}

// PATCH /api/receivables/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  
  // Get current receivable
  const current = await prisma.receivable.findFirst({
    where: { id: params.id, organizationId: user.organizationId }
  })
  if (!current) return notFound('Receivable not found')
  
  // Convert dates
  if (body.issueDate) body.issueDate = new Date(body.issueDate)
  if (body.dueDate) body.dueDate = new Date(body.dueDate)
  if (body.expectedPaymentDate) body.expectedPaymentDate = new Date(body.expectedPaymentDate)
  if (body.disputeOpenedAt) body.disputeOpenedAt = new Date(body.disputeOpenedAt)
  if (body.disputeResolvedAt) body.disputeResolvedAt = new Date(body.disputeResolvedAt)
  
  // Track status change for event
  const statusChanged = body.status && body.status !== current.status
  const previousStatus = current.status
  
  // Handle dispute opening
  if (body.isDisputed === true && !current.isDisputed) {
    body.disputeOpenedAt = new Date()
    body.status = 'disputed'
    body.disputedAmount = current.outstandingAmount
  }
  
  // Handle dispute resolution
  if (body.isDisputed === false && current.isDisputed) {
    body.disputeResolvedAt = new Date()
    body.disputedAmount = 0
  }
  
  body.lastActivityDate = new Date()
  
  const result = await prisma.receivable.update({
    where: { id: params.id },
    data: body
  })
  
  // Create event for status change
  if (statusChanged) {
    await prisma.receivableEvent.create({
      data: {
        type: 'status_changed',
        description: `Status changed from ${previousStatus} to ${body.status}`,
        previousValue: previousStatus,
        newValue: body.status,
        performedBy: user.id,
        receivableId: params.id,
      }
    })
  }
  
  const updated = await prisma.receivable.findUnique({
    where: { id: params.id },
    include: {
      paymentApplications: { orderBy: { appliedAt: 'desc' } },
      events: { orderBy: { createdAt: 'desc' } }
    }
  })
  
  return NextResponse.json(updated)
}

// DELETE /api/receivables/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const result = await prisma.receivable.deleteMany({
    where: { id: params.id, organizationId: user.organizationId }
  })
  
  if (result.count === 0) return notFound('Receivable not found')
  
  return NextResponse.json({ success: true })
}