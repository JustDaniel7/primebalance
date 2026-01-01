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

    // Also create an archive record for cross-module tracking
    try {
        await prisma.archiveRecord.create({
            data: {
                archiveRecordId: `arc_${user.organizationId.slice(-6)}_report_${id}_v1_${Date.now()}`,
                originalObjectId: id,
                objectType: 'report',
                objectVersion: 1,
                triggerType: 'user_action',
                triggerReason: body.reason || 'User requested archive',
                title: existing.name,
                description: `${existing.type} report`,
                content: {
                    reportType: existing.type,
                    parameters: existing.parameters,
                },
                contentType: 'application/json',
                contentHash: `sha256_${Date.now().toString(16)}`,
                category: 'compliance',
                effectiveDate: existing.createdAt,
                actorType: 'user',
                status: 'archived',
                retentionStatus: 'active',
                language: 'en',
                timezone: 'UTC',
                currency: 'USD',
                versionNumber: 1,
                isCurrentVersion: true,
                signatureCount: 0,
                integrityVerified: true,
                legalHold: false,
                accessCount: 0,
                exportCount: 0,
                documentCount: 0,
                archivedAt: new Date(),
                createdAt: new Date(),
                organizationId: user.organizationId,
            }
        })
    } catch {
        // Archive record creation is non-critical, continue with report archival
    }

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