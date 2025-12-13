// src/app/api/tax/entities/route.ts
// Corporate Entities API - GET (list), POST (create)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/tax/entities - List all corporate entities
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entities = await prisma.corporateEntity.findMany({
      where: { userId: session.user.id },
      include: {
        children: true,
        parent: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Build hierarchy
    const rootEntities = entities.filter(e => !e.parentId)
    
    const buildHierarchy = (entity: any): any => ({
      id: entity.id,
      name: entity.name,
      type: entity.type,
      jurisdiction: entity.jurisdiction,
      taxId: entity.taxId,
      incorporationDate: entity.incorporationDate?.toISOString().split('T')[0],
      ownershipPercent: entity.ownershipPercent ? Number(entity.ownershipPercent) : null,
      revenue: entity.revenue ? Number(entity.revenue) : null,
      expenses: entity.expenses ? Number(entity.expenses) : null,
      taxLiability: entity.taxLiability ? Number(entity.taxLiability) : null,
      effectiveTaxRate: entity.effectiveTaxRate ? Number(entity.effectiveTaxRate) : null,
      isActive: entity.isActive,
      parentId: entity.parentId,
      children: entities
        .filter(e => e.parentId === entity.id)
        .map(buildHierarchy),
    })

    const hierarchy = rootEntities.map(buildHierarchy)

    // Calculate totals
    const totals = entities.reduce((acc, e) => ({
      revenue: acc.revenue + (Number(e.revenue) || 0),
      expenses: acc.expenses + (Number(e.expenses) || 0),
      taxLiability: acc.taxLiability + (Number(e.taxLiability) || 0),
    }), { revenue: 0, expenses: 0, taxLiability: 0 })

    return NextResponse.json({
      entities: hierarchy,
      flat: entities.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        jurisdiction: e.jurisdiction,
        parentId: e.parentId,
      })),
      totals,
    })
  } catch (error) {
    console.error('GET /api/tax/entities error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entities' },
      { status: 500 }
    )
  }
}

// POST /api/tax/entities - Create new corporate entity
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const {
      name,
      type,
      jurisdiction,
      taxId,
      incorporationDate,
      parentId,
      ownershipPercent,
      revenue,
      expenses,
    } = body

    if (!name || !type || !jurisdiction) {
      return NextResponse.json(
        { error: 'Name, type, and jurisdiction are required' },
        { status: 400 }
      )
    }

    // Verify parent belongs to user if provided
    if (parentId) {
      const parent = await prisma.corporateEntity.findFirst({
        where: { id: parentId, userId: session.user.id },
      })
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent entity not found' },
          { status: 400 }
        )
      }
    }

    const entity = await prisma.corporateEntity.create({
      data: {
        userId: session.user.id,
        name,
        type,
        jurisdiction,
        taxId,
        incorporationDate: incorporationDate ? new Date(incorporationDate) : null,
        parentId,
        ownershipPercent: ownershipPercent ? new Prisma.Decimal(ownershipPercent) : null,
        revenue: revenue ? new Prisma.Decimal(revenue) : null,
        expenses: expenses ? new Prisma.Decimal(expenses) : null,
        isActive: true,
      },
    })

    return NextResponse.json({
      id: entity.id,
      name: entity.name,
      type: entity.type,
      jurisdiction: entity.jurisdiction,
      parentId: entity.parentId,
      createdAt: entity.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/tax/entities error:', error)
    return NextResponse.json(
      { error: 'Failed to create entity' },
      { status: 500 }
    )
  }
}