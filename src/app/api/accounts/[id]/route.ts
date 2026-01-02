// src/app/api/accounts/[id]/route.ts
// NEW FILE: Single account operations

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { id } = await params
  const account = await prisma.financialAccount.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { children: true, transactions: { take: 10, orderBy: { date: 'desc' } } }
  })
  
  if (!account) return notFound('Account')
  return NextResponse.json(account)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { id } = await params
  const body = await req.json()
  
  const result = await prisma.financialAccount.updateMany({
    where: { id, organizationId: user.organizationId },
    data: body
  })

  if (result.count === 0) return notFound('Account')

  // SECURITY: Always include organizationId filter to prevent cross-org data leaks
  const updated = await prisma.financialAccount.findFirst({
    where: { id, organizationId: user.organizationId }
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { id } = await params
  const result = await prisma.financialAccount.deleteMany({
    where: { id, organizationId: user.organizationId }
  })
  
  if (result.count === 0) return notFound('Account')
  return NextResponse.json({ success: true })
}