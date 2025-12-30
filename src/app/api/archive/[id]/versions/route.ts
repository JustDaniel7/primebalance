// =============================================================================
// ARCHIVE API - Version Chain Route
// src/app/api/archive/[id]/versions/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// GET - Get Version Chain for Archive Record
// =============================================================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify record exists
        const record = await (prisma as any).archiveRecord.findFirst({
            where: {
                id,
                organizationId: session.user.organizationId,
            },
        });

        if (!record) {
            return NextResponse.json({ error: 'Archive record not found' }, { status: 404 });
        }

        // Get all versions for this object
        const allVersions = await (prisma as any).archiveRecord.findMany({
            where: {
                organizationId: session.user.organizationId,
                originalObjectId: record.originalObjectId,
                objectType: record.objectType,
            },
            orderBy: { objectVersion: 'desc' },
            select: {
                id: true,
                archiveRecordId: true,
                objectVersion: true,
                versionNumber: true,
                isCurrentVersion: true,
                supersededBy: true,
                supersedes: true,
                versionReason: true,
                contentHash: true,
                predecessorHash: true,
                archivedAt: true,
                initiatingActor: true,
                initiatingActorName: true,
                triggerType: true,
            },
        });

        // Get detailed version records
        const versionDetails = await (prisma as any).archiveVersion.findMany({
            where: { archiveRecordId: id },
            orderBy: { versionNumber: 'desc' },
        });

        // Build version chain
        const versionChain = allVersions.map((v: any, idx: number) => ({
            ...v,
            position: idx + 1,
            isFirst: idx === allVersions.length - 1,
            isLast: idx === 0,
            previousVersionId: idx < allVersions.length - 1 ? allVersions[idx + 1].id : null,
            nextVersionId: idx > 0 ? allVersions[idx - 1].id : null,
        }));

        return NextResponse.json({
            currentVersion: record.objectVersion,
            totalVersions: allVersions.length,
            versions: versionChain,
            versionDetails,
        });
    } catch (error) {
        console.error('Error fetching version chain:', error);
        return NextResponse.json(
            { error: 'Failed to fetch version chain' },
            { status: 500 }
        );
    }
}