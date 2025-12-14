// src/app/api/accounts/route.ts
// NEW FILE: Financial accounts CRUD

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/accounts
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const accounts = await prisma.financialAccount.findMany({
    where: { organizationId: user.organizationId },
    include: { children: true },
    orderBy: { accountNumber: 'asc' }
  })
  
  return NextResponse.json(accounts)
}

// POST /api/accounts
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const { name, accountNumber, type, currency, parentId, description } = body
  
  if (!name || !accountNumber || !type) {
    return badRequest('Missing required fields')
  }
  
  const account = await prisma.financialAccount.create({
    data: {
      name,
      accountNumber,
      type,
      currency: currency || 'USD',
      parentId,
      description,
      organizationId: user.organizationId,
    }
  })
  
  return NextResponse.json(account, { status: 201 })
}