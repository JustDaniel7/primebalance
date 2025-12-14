// src/app/api/transactions/route.ts
// NEW FILE: Transactions CRUD

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/transactions
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  
  const where: any = { organizationId: user.organizationId }
  if (type) where.type = type
  if (status) where.status = status
  
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { account: true },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.transaction.count({ where })
  ])
  
  return NextResponse.json({ transactions, total, limit, offset })
}

// POST /api/transactions
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const { date, description, amount, currency, type, category, accountId, tags, status } = body
  
  if (!date || !description || amount === undefined || !accountId) {
    return badRequest('Missing required fields')
  }
  
  const transaction = await prisma.transaction.create({
    data: {
      date: new Date(date),
      description,
      amount,
      currency: currency || 'USD',
      type,
      category,
      accountId,
      tags: tags || [],
      status: status || 'pending',
      organizationId: user.organizationId,
    },
    include: { account: true }
  })
  
  return NextResponse.json(transaction, { status: 201 })
}