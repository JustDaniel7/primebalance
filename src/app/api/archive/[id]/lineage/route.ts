// =============================================================================
// ARCHIVE API - Lineage/Dependency Graph Route
// src/app/api/archive/[id]/lineage/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// GET - Get Dependency Graph (Netting & Linkage - TS Section 5)
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

        const organizationId = session.user.organizationId;
        const { id } = await params;
        const { searchParams } = new URL(request.url);

        const direction = searchParams.get('direction') || 'both'; // inbound, outbound, both
        const maxDepth = parseInt(searchParams.get('maxDepth') || '5');
        const linkTypes = searchParams.get('linkTypes')?.split(',').filter(Boolean);

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

        // Build graph
        const visited = new Set<string>();
        const nodes: any[] = [];
        const edges: any[] = [];
        const inbound: any[] = [];
        const outbound: any[] = [];

        async function traverseOutbound(currentId: string, depth: number) {
            if (visited.has(`out_${currentId}`) || depth > maxDepth) return;
            visited.add(`out_${currentId}`);

            const linkWhere: any = { sourceArchiveId: currentId };
            if (linkTypes?.length) linkWhere.linkType = { in: linkTypes };

            const links = await (prisma as any).archiveLink.findMany({
                where: linkWhere,
            });

            for (const link of links) {
                const targetRecord = await (prisma as any).archiveRecord.findFirst({
                    where: {
                        id: link.targetArchiveId,
                        organizationId,
                    },
                    select: {
                        id: true,
                        archiveRecordId: true,
                        objectType: true,
                        title: true,
                        category: true,
                        archivedAt: true,
                        amount: true,
                        currency: true,
                    },
                });

                if (targetRecord && !nodes.find(n => n.id === targetRecord.id)) {
                    nodes.push({ ...targetRecord, depth, direction: 'downstream' });
                }

                edges.push({
                    sourceId: currentId,
                    targetId: link.targetArchiveId,
                    linkType: link.linkType,
                    direction: 'outbound',
                    depth,
                });

                outbound.push(link);

                await traverseOutbound(link.targetArchiveId, depth + 1);
            }
        }

        async function traverseInbound(currentId: string, depth: number) {
            if (visited.has(`in_${currentId}`) || depth > maxDepth) return;
            visited.add(`in_${currentId}`);

            const linkWhere: any = { targetArchiveId: currentId };
            if (linkTypes?.length) linkWhere.linkType = { in: linkTypes };

            const links = await (prisma as any).archiveLink.findMany({
                where: linkWhere,
            });

            for (const link of links) {
                const sourceRecord = await (prisma as any).archiveRecord.findFirst({
                    where: {
                        id: link.sourceArchiveId,
                        organizationId,
                    },
                    select: {
                        id: true,
                        archiveRecordId: true,
                        objectType: true,
                        title: true,
                        category: true,
                        archivedAt: true,
                        amount: true,
                        currency: true,
                    },
                });

                if (sourceRecord && !nodes.find(n => n.id === sourceRecord.id)) {
                    nodes.push({ ...sourceRecord, depth, direction: 'upstream' });
                }

                edges.push({
                    sourceId: link.sourceArchiveId,
                    targetId: currentId,
                    linkType: link.linkType,
                    direction: 'inbound',
                    depth,
                });

                inbound.push(link);

                await traverseInbound(link.sourceArchiveId, depth + 1);
            }
        }

        // Add root node
        nodes.push({
            id: record.id,
            archiveRecordId: record.archiveRecordId,
            objectType: record.objectType,
            title: record.title,
            category: record.category,
            archivedAt: record.archivedAt,
            amount: record.amount ? Number(record.amount) : null,
            currency: record.currency,
            depth: 0,
            direction: 'root',
            isRoot: true,
        });

        // Traverse based on direction
        if (direction === 'both' || direction === 'outbound') {
            await traverseOutbound(id, 1);
        }
        if (direction === 'both' || direction === 'inbound') {
            await traverseInbound(id, 1);
        }

        // Build summary
        const summary = {
            upstreamCount: nodes.filter(n => n.direction === 'upstream').length,
            downstreamCount: nodes.filter(n => n.direction === 'downstream').length,
            byObjectType: nodes.reduce((acc: any, n) => {
                acc[n.objectType] = (acc[n.objectType] || 0) + 1;
                return acc;
            }, {}),
            byLinkType: edges.reduce((acc: any, e) => {
                acc[e.linkType] = (acc[e.linkType] || 0) + 1;
                return acc;
            }, {}),
        };

        return NextResponse.json({
            rootId: id,
            nodes,
            edges,
            inbound,
            outbound,
            summary,
            traversalConfig: {
                direction,
                maxDepth,
                linkTypes: linkTypes || 'all',
            },
        });
    } catch (error) {
        console.error('Error fetching lineage:', error);
        return NextResponse.json(
            { error: 'Failed to fetch lineage' },
            { status: 500 }
        );
    }
}