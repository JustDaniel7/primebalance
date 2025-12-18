// src/app/api/treasury/accounts/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/treasury/accounts
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  
  const where: any = { organizationId: user.organizationId }
  if (type) where.type = type
  if (status) where.status = status
  
  const accounts = await prisma.treasuryAccount.findMany({
    where,
    include: {
      cashMovements: {
        orderBy: { movementDate: 'desc' },
        take: 10
      }
    },
    orderBy: { name: 'asc' }
  })
  
  return NextResponse.json(accounts)
}

// POST /api/treasury/accounts
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const {
    name,
    accountNumber,
    type,
    bankName,
    bankCode,
    iban,
    cashClassification,
    currency,
    currentBalance,
    minimumBalance,
    targetBalance,
    isMainAccount,
    participatesInPooling,
    poolingRole,
    masterAccountId,
    entityId,
    notes,
  } = body
  
  if (!name || !type) {
    return badRequest('Missing required fields: name, type')
  }
  
  const balance = currentBalance || 0
  
  const account = await prisma.treasuryAccount.create({
    data: {
      name,
      accountNumber,
      type,
      bankName,
      bankCode,
      iban,
      cashClassification: cashClassification || 'unrestricted',
      currency: currency || 'EUR',
      currentBalance: balance,
      availableBalance: balance,
      minimumBalance,
      targetBalance,
      isMainAccount: isMainAccount || false,
      participatesInPooling: participatesInPooling || false,
      poolingRole,
      masterAccountId,
      entityId,
      notes,
      organizationId: user.organizationId,
    }
  })
  
  return NextResponse.json(account, { status: 201 })
}