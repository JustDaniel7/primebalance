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

    // Calculate permanent deletion date (60 days from now)
    const now = new Date()
    const permanentDeletionDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
    const warningDate = new Date(permanentDeletionDate.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days before

    // Soft delete - move to archive instead of hard delete
    const archiveRecordId = `AR-RPT-${id}-${Date.now()}`
    await prisma.archiveRecord.create({
        data: {
            archiveRecordId,
            originalObjectId: id,
            objectType: 'report',
            title: `Report: ${existing.name}`,
            description: `Deleted report of type ${existing.type}`,
            category: 'reports',
            subcategory: existing.type,
            content: existing as any,
            contentHash: Buffer.from(JSON.stringify(existing)).toString('base64').slice(0, 64),
            createdAt: existing.createdAt,
            triggerType: 'user_action',
            triggerReason: 'Report deleted by user',
            initiatingActor: user.id,
            initiatingActorName: user.name || user.email,
            actorType: 'user',
            sourceModule: 'reports',
            status: 'archived',
            retentionStatus: 'active',
            retentionStartDate: now,
            retentionEndDate: permanentDeletionDate,
            organizationId: user.organizationId || undefined,
        },
    })

    // Update report status to deleted (soft delete)
    await prisma.savedReport.update({
        where: { id },
        data: {
            status: 'deleted',
            archivedAt: now,
            cacheExpiry: permanentDeletionDate, // Use cacheExpiry for permanent deletion date
        } as any,
    })

    return NextResponse.json({
        success: true,
        message: 'Report moved to trash. Will be permanently deleted in 60 days.',
        id,
        permanentDeletionDate: permanentDeletionDate.toISOString(),
        warningDate: warningDate.toISOString(),
        daysUntilPermanentDeletion: 60,
        canRestore: true,
        warning: 'This report will be permanently deleted after 60 days. You can restore it from the Archive before then.',
    })
}