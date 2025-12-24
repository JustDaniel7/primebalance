// src/app/api/reports/[id]/route.ts
// NEW FILE: Single report operations

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getSessionWithOrg()
    if (!user) return unauthorized()

    const { id } = await params

    const report = await prisma.savedReport.findFirst({
        where: { id, userId: user.id }
    })

    if (!report) return notFound('Report')

    return NextResponse.json({
        id: report.id,
        name: report.name,
        type: report.type,
        description: (report as any).description,
        parameters: report.parameters,
        status: (report as any).status || 'active',
        isScheduled: report.isScheduled,
        scheduleFreq: report.scheduleFreq,
        lastGenerated: report.lastGenerated?.toISOString(),
        cachedData: (report as any).cachedData,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
    })
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getSessionWithOrg()
    if (!user) return unauthorized()

    const { id } = await params
    const body = await req.json()

    const existing = await prisma.savedReport.findFirst({
        where: { id, userId: user.id }
    })

    if (!existing) return notFound('Report')

    const { name, description, parameters, isScheduled, scheduleFreq, status } = body

    const report = await prisma.savedReport.update({
        where: { id },
        data: {
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(parameters && { parameters }),
            ...(isScheduled !== undefined && { isScheduled }),
            ...(scheduleFreq !== undefined && { scheduleFreq }),
            ...(status && { status }),
            ...(status === 'archived' && { archivedAt: new Date() }),
        } as any,
    })

    return NextResponse.json(report)
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getSessionWithOrg()
    if (!user) return unauthorized()

    const { id } = await params

    const existing = await prisma.savedReport.findFirst({
        where: { id, userId: user.id }
    })

    if (!existing) return notFound('Report')

    await prisma.savedReport.delete({ where: { id } })

    return NextResponse.json({ success: true })
}