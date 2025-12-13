// src/app/api/reports/route.ts
// Reports API - GET (list saved), POST (generate/save)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/reports - List saved reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reports = await prisma.savedReport.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      reports: reports.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type.toLowerCase().replace('_', '-'),
        parameters: r.parameters,
        isScheduled: r.isScheduled,
        scheduleFreq: r.scheduleFreq,
        lastGenerated: r.lastGenerated?.toISOString(),
        createdAt: r.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

// POST /api/reports - Save a report configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, parameters, isScheduled, scheduleFreq } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    const report = await prisma.savedReport.create({
      data: {
        userId: session.user.id,
        name,
        type: type.toUpperCase().replace('-', '_') as any,
        parameters: parameters || {},
        isScheduled: isScheduled || false,
        scheduleFreq,
      },
    })

    return NextResponse.json({
      id: report.id,
      name: report.name,
      type: report.type.toLowerCase().replace('_', '-'),
      createdAt: report.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/reports error:', error)
    return NextResponse.json(
      { error: 'Failed to save report' },
      { status: 500 }
    )
  }
}