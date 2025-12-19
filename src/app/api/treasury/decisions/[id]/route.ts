// src/app/api/treasury/decisions/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils'

// GET /api/treasury/decisions/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  const {id} = await params;
  const decision = await prisma.treasuryDecision.findFirst({
    where: { id: id, organizationId: user.organizationId }
  })
  
  if (!decision) return notFound('Decision not found')
  
  return NextResponse.json(decision)
}

// PATCH /api/treasury/decisions/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const {id} = await params;
  // Get current decision
  const current = await prisma.treasuryDecision.findFirst({
    where: { id: id, organizationId: user.organizationId }
  })
  if (!current) return notFound('Decision not found')
  
  // Handle status transitions
  if (body.action) {
    switch (body.action) {
      case 'approve':
        if (current.status !== 'pending') {
          return badRequest('Can only approve pending decisions')
        }
        body.status = 'approved'
        body.approvedBy = user.id
        body.approvedAt = new Date()
        break
        
      case 'reject':
        if (current.status !== 'pending') {
          return badRequest('Can only reject pending decisions')
        }
        body.status = 'rejected'
        body.rejectedBy = user.id
        body.rejectedAt = new Date()
        body.rejectionReason = body.reason
        break
        
      case 'execute':
        if (!['pending', 'approved'].includes(current.status)) {
          return badRequest('Can only execute pending or approved decisions')
        }
        body.status = 'executed'
        body.executedBy = user.id
        body.executedAt = new Date()
        body.executionNotes = body.notes
        break
        
      case 'cancel':
        if (['executed', 'cancelled'].includes(current.status)) {
          return badRequest('Cannot cancel executed or already cancelled decisions')
        }
        body.status = 'cancelled'
        break
    }
    delete body.action
    delete body.reason
  }
  
  // Convert dates
  if (body.scheduledDate) body.scheduledDate = new Date(body.scheduledDate)
  if (body.expiresAt) body.expiresAt = new Date(body.expiresAt)

  const result = await prisma.treasuryDecision.updateMany({
    where: { id: id, organizationId: user.organizationId },
    data: body
  })
  
  if (result.count === 0) return notFound('Decision not found')
  
  const updated = await prisma.treasuryDecision.findUnique({ where: { id: id } })
  return NextResponse.json(updated)
}

// DELETE /api/treasury/decisions/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  const {id} = await params;
  const result = await prisma.treasuryDecision.deleteMany({
    where: { id: id, organizationId: user.organizationId }
  })
  
  if (result.count === 0) return notFound('Decision not found')
  
  return NextResponse.json({ success: true })
}