// src/app/api/reports/[id]/archive/route.ts
// NEW FILE: Archive/restore report

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils'

// POST /api/reports/[id]/archive - Archive a report
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getSessionWithOrg()
    if (!user?.organizationId) return unauthorized()

    const { id } = await params
    const body = await req.json().catch(() => ({}))

    const existing = await prisma.savedReport.findFirst({
        where: { id, userId: user.id }
    })

    if (!existing) return notFound('Report')

    // Also create an archive item for cross-module tracking
    await prisma.archiveItem.create({
        data: {
            category: 'documents',
            status: 'archived',
            originalId: id,
            originalType: 'report',
            title: existing.name,
            description: `${existing.type} report`,
            itemDate: existing.createdAt,
            archivedBy: user.id,
            archiveReason: body.reason || 'User requested archive',
            metadata: {
                reportType: existing.type,
                parameters: existing.parameters,
            },
            organizationId: user.organizationId,
        }
    })

    // Update report status
    const report = await prisma.savedReport.update({
        where: { id },
        data: {
            status: 'archived',
            archivedAt: new Date(),
        } as any,
    })

    return NextResponse.json({
        success: true,
        report: {
            id: report.id,
            name: report.name,
            status: 'archived',
        }
    })
}

// DELETE /api/reports/[id]/archive - Restore from archive
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

    const report = await prisma.savedReport.update({
        where: { id },
        data: {
            status: 'active',
            archivedAt: null,
        } as any,
    })

    return NextResponse.json({
        success: true,
        report: {
            id: report.id,
            name: report.name,
            status: 'active',
        }
    })
}