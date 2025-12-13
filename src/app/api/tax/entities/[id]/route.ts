// src/app/api/tax/entities/[id]/route.ts
// Single Corporate Entity API - GET, PUT, DELETE

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Prisma from '@prisma/client'

interface RouteParams {
  params: { id: string }
}

// GET /api/tax/entities/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entity = await prisma.corporateEntity.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        children: true,
        parent: true,
      },
    })

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    return NextResponse.json({
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
      parent: entity.parent ? {
        id: entity.parent.id,
        name: entity.parent.name,
      } : null,
      children: entity.children.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        jurisdiction: c.jurisdiction,
      })),
    })
  } catch (error) {
    console.error('GET /api/tax/entities/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entity' },
      { status: 500 }
    )
  }
}

// PUT /api/tax/entities/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.corporateEntity.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    const body = await request.json()
    const updateData: Prisma.CorporateEntityUpdateInput = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.type !== undefined) updateData.type = body.type
    if (body.jurisdiction !== undefined) updateData.jurisdiction = body.jurisdiction
    if (body.taxId !== undefined) updateData.taxId = body.taxId
    if (body.incorporationDate !== undefined) {
      updateData.incorporationDate = body.incorporationDate ? new Date(body.incorporationDate) : null
    }
    if (body.ownershipPercent !== undefined) {
      updateData.ownershipPercent = body.ownershipPercent ? new Prisma.Decimal(body.ownershipPercent) : null
    }
    if (body.revenue !== undefined) {
      updateData.revenue = body.revenue ? new Prisma.Decimal(body.revenue) : null
    }
    if (body.expenses !== undefined) {
      updateData.expenses = body.expenses ? new Prisma.Decimal(body.expenses) : null
    }
    if (body.taxLiability !== undefined) {
      updateData.taxLiability = body.taxLiability ? new Prisma.Decimal(body.taxLiability) : null
    }
    if (body.effectiveTaxRate !== undefined) {
      updateData.effectiveTaxRate = body.effectiveTaxRate ? new Prisma.Decimal(body.effectiveTaxRate) : null
    }
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.parentId !== undefined) {
      // Prevent circular reference
      if (body.parentId === params.id) {
        return NextResponse.json(
          { error: 'Entity cannot be its own parent' },
          { status: 400 }
        )
      }
      if (body.parentId === null) {
        updateData.parent = { disconnect: true }
      } else {
        updateData.parent = { connect: { id: body.parentId } }
      }
    }

    const entity = await prisma.corporateEntity.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({
      id: entity.id,
      name: entity.name,
      type: entity.type,
      jurisdiction: entity.jurisdiction,
      parentId: entity.parentId,
      updatedAt: entity.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('PUT /api/tax/entities/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update entity' },
      { status: 500 }
    )
  }
}

// DELETE /api/tax/entities/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.corporateEntity.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        children: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    // Check for children
    if (existing.children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete entity with subsidiaries. Delete or reassign them first.' },
        { status: 400 }
      )
    }

    await prisma.corporateEntity.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/tax/entities/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete entity' },
      { status: 500 }
    )
  }
}