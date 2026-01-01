// src/app/api/reports/route.ts
// REPLACE: Enhanced with status filter, archive support

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/reports - List saved reports
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'active'
  const type = searchParams.get('type')

  const where: Record<string, unknown> = { userId: user.id }
  if (status !== 'all') where.status = status
  if (type) where.type = type

  const reports = await prisma.savedReport.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    reports: reports.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      description: r.description,
      parameters: r.parameters,
      status: r.status || 'active',
      isScheduled: r.isScheduled,
      scheduleFreq: r.scheduleFreq,
      lastGenerated: r.lastGenerated?.toISOString(),
      archivedAt: r.archivedAt?.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  })
}

// POST /api/reports - Save a report configuration
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user) return unauthorized()

  const body = await req.json()
  const { name, type, description, parameters, isScheduled, scheduleFreq } = body

  if (!name || !type) {
    return badRequest('Name and type are required')
  }

  const report = await prisma.savedReport.create({
    data: {
      userId: user.id,
      name,
      type,
      description,
      parameters: parameters || {},
      isScheduled: isScheduled || false,
      scheduleFreq,
    },
  })

  return NextResponse.json({
    id: report.id,
    name: report.name,
    type: report.type,
    createdAt: report.createdAt.toISOString(),
  }, { status: 201 })
}