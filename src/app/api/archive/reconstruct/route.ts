// =============================================================================
// ARCHIVE API - Time-Travel Reconstruction (TS Section 12)
// src/app/api/archive/reconstruct/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// POST - Reconstruct State at Point in Time
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { objectId, objectType, asOfDate, includeLineage = false } = body;

        // Validate required fields
        if (!objectId || !objectType || !asOfDate) {
            return NextResponse.json(
                { error: 'objectId, objectType, and asOfDate are required' },
                { status: 400 }
            );
        }

        const targetDate = new Date(asOfDate);
        if (isNaN(targetDate.getTime())) {
            return NextResponse.json(
                { error: 'Invalid asOfDate format' },
                { status: 400 }
            );
        }

        // Find all archive records for this object up to the target date
        const archiveRecords = await (prisma as any).archiveRecord.findMany({
            where: {
                organizationId: session.user.organizationId,
                originalObjectId: objectId,
                objectType,
                archivedAt: { lte: targetDate },
            },
            orderBy: [
                { objectVersion: 'desc' },
                { archivedAt: 'desc' },
            ],
        });

        if (archiveRecords.length === 0) {
            return NextResponse.json(
                {
                    error: 'No archive records found for this object as of the specified date',
                    objectId,
                    objectType,
                    asOfDate,
                },
                { status: 404 }
            );
        }

        // Get the latest version as of that date
        const latestRecord = archiveRecords[0];

        // Verify integrity chain
        const integrityChain: Array<{
            version: number;
            hash: string;
            predecessorHash: string | null;
            valid: boolean;
        }> = [];

        let chainValid = true;
        for (let i = archiveRecords.length - 1; i >= 0; i--) {
            const record = archiveRecords[i];
            const expectedPredecessor = i < archiveRecords.length - 1
                ? archiveRecords[i + 1].contentHash
                : null;

            const valid = !record.predecessorHash || record.predecessorHash === expectedPredecessor;
            if (!valid) chainValid = false;

            integrityChain.push({
                version: record.objectVersion,
                hash: record.contentHash,
                predecessorHash: record.predecessorHash,
                valid,
            });
        }

        // Reconstruct state by applying all versions in sequence
        let reconstructedState = {};
        const appliedVersions: number[] = [];

        for (let i = archiveRecords.length - 1; i >= 0; i--) {
            const record = archiveRecords[i];
            reconstructedState = {
                ...reconstructedState,
                ...record.content,
            };
            appliedVersions.push(record.objectVersion);
        }

        // Get lineage if requested
        let lineage = null;
        if (includeLineage) {
            lineage = await buildLineageAtDate(latestRecord.id, session.user.organizationId, targetDate);
        }

        // Get period context
        const periodContext = {
            fiscalYear: latestRecord.fiscalYear,
            fiscalPeriod: latestRecord.fiscalPeriod,
            accountingPeriod: latestRecord.accountingPeriod,
        };

        // Log reconstruction access
        await (prisma as any).archiveAccessLog.create({
            data: {
                archiveRecordId: latestRecord.id,
                accessType: 'view',
                accessReason: `Time-travel reconstruction as of ${asOfDate}`,
                accessScope: 'full',
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                accessGranted: true,
            },
        });

        return NextResponse.json({
            reconstruction: {
                objectId,
                objectType,
                asOfDate,
                reconstructedState,
                latestVersionAsOf: latestRecord.objectVersion,
                appliedVersions,
                archiveRecordId: latestRecord.archiveRecordId,
            },
            integrity: {
                chainValid,
                integrityChain: integrityChain.reverse(),
                recordsInChain: archiveRecords.length,
            },
            metadata: {
                archivedAt: latestRecord.archivedAt,
                effectiveDate: latestRecord.effectiveDate,
                triggerType: latestRecord.triggerType,
                initiatingActor: latestRecord.initiatingActorName,
            },
            periodContext,
            lineage,
            archiveRecordsUsed: archiveRecords.map((r: any) => r.id),
        });
    } catch (error) {
        console.error('Error reconstructing archive:', error);
        return NextResponse.json(
            { error: 'Failed to reconstruct archive state' },
            { status: 500 }
        );
    }
}

// Helper function to build lineage at a specific date
async function buildLineageAtDate(archiveId: string, organizationId: string, asOfDate: Date) {
    const nodes: any[] = [];
    const edges: any[] = [];
    const visited = new Set<string>();

    async function traverse(id: string, depth: number) {
        if (visited.has(id) || depth > 5) return;
        visited.add(id);

        const record = await (prisma as any).archiveRecord.findFirst({
            where: {
                id,
                organizationId,
                archivedAt: { lte: asOfDate },
            },
            select: {
                id: true,
                archiveRecordId: true,
                objectType: true,
                title: true,
                archivedAt: true,
            },
        });

        if (!record) return;

        nodes.push({ ...record, depth });

        const links = await (prisma as any).archiveLink.findMany({
            where: {
                OR: [
                    { sourceArchiveId: id },
                    { targetArchiveId: id },
                ],
                linkedAt: { lte: asOfDate },
            },
        });

        for (const link of links) {
            edges.push({
                sourceId: link.sourceArchiveId,
                targetId: link.targetArchiveId,
                linkType: link.linkType,
            });

            const nextId = link.sourceArchiveId === id ? link.targetArchiveId : link.sourceArchiveId;
            await traverse(nextId, depth + 1);
        }
    }

    await traverse(archiveId, 0);

    return { nodes, edges };
}