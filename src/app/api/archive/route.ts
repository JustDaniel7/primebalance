// src/app/api/archive/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/archive
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const fiscalYear = searchParams.get('fiscalYear')
  const status = searchParams.get('status') || 'archived'
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  
  const where: any = { 
    organizationId: user.organizationId,
    status
  }
  if (category) where.category = category
  if (fiscalYear) where.fiscalYear = parseInt(fiscalYear)
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { counterparty: { contains: search, mode: 'insensitive' } },
    ]
  }
  
  const [items, total] = await Promise.all([
    prisma.archiveItem.findMany({
      where,
      orderBy: { archivedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.archiveItem.count({ where })
  ])
  
  // Get stats
  const stats = await prisma.archiveItem.groupBy({
    by: ['category'],
    where: { organizationId: user.organizationId, status: 'archived' },
    _count: { id: true },
    _sum: { amount: true }
  })
  
  return NextResponse.json({ items, total, limit, offset, stats })
}

// POST /api/archive
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const {
    category,
    originalId,
    originalType,
    title,
    description,
    amount,
    currency,
    counterparty,
    itemDate,
    fiscalYear,
    fiscalPeriod,
    tags,
    attachments,
    metadata,
    archiveReason,
  } = body
  
  if (!category || !originalId || !originalType || !title || !itemDate) {
    return badRequest('Missing required fields')
  }
  
  const archiveItem = await prisma.archiveItem.create({
    data: {
      category,
      originalId,
      originalType,
      title,
      description,
      amount,
      currency: currency || 'EUR',
      counterparty,
      itemDate: new Date(itemDate),
      fiscalYear,
      fiscalPeriod,
      tags: tags || [],
      attachments,
      metadata,
      archiveReason,
      archivedBy: user.id,
      organizationId: user.organizationId,
    }
  })
  
  return NextResponse.json(archiveItem, { status: 201 })
}