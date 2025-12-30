// =============================================================================
// ARCHIVE API - Link Management
// src/app/api/archive/links/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// POST - Create Archive Link (TS Section 5)
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { sourceArchiveId, targetArchiveId, linkType, linkDescription } = body;

        // Validate required fields
        if (!sourceArchiveId || !targetArchiveId || !linkType) {
            return NextResponse.json(
                { error: 'sourceArchiveId, targetArchiveId, and linkType are required' },
                { status: 400 }
            );
        }

        // Validate link type
        const validLinkTypes = ['derives_from', 'generates', 'affects', 'references', 'supersedes', 'reverses'];
        if (!validLinkTypes.includes(linkType)) {
            return NextResponse.json(
                { error: `Invalid link type. Must be one of: ${validLinkTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Verify both records exist and belong to organization
        const [sourceRecord, targetRecord] = await Promise.all([
            (prisma as any).archiveRecord.findFirst({
                where: { id: sourceArchiveId, organizationId: session.user.organizationId },
            }),
            (prisma as any).archiveRecord.findFirst({
                where: { id: targetArchiveId, organizationId: session.user.organizationId },
            }),
        ]);

        if (!sourceRecord) {
            return NextResponse.json({ error: 'Source archive record not found' }, { status: 404 });
        }
        if (!targetRecord) {
            return NextResponse.json({ error: 'Target archive record not found' }, { status: 404 });
        }

        // Check for existing link
        const existingLink = await (prisma as any).archiveLink.findFirst({
            where: {
                sourceArchiveId,
                targetArchiveId,
                linkType,
            },
        });

        if (existingLink) {
            return NextResponse.json(
                {
                    error: 'Link already exists',
                    existingLink,
                },
                { status: 409 }
            );
        }

        // Determine link direction
        let linkDirection = 'outbound';
        if (linkType === 'derives_from') linkDirection = 'inbound';
        if (linkType === 'references') linkDirection = 'bidirectional';

        // Create link
        const link = await (prisma as any).archiveLink.create({
            data: {
                sourceArchiveId,
                targetArchiveId,
                linkType,
                linkDirection,
                linkDescription,
                linkedBy: session.user.id,
                isImmutable: true,
            },
        });

        // Create reverse link for bidirectional
        if (linkDirection === 'bidirectional') {
            await (prisma as any).archiveLink.create({
                data: {
                    sourceArchiveId: targetArchiveId,
                    targetArchiveId: sourceArchiveId,
                    linkType,
                    linkDirection: 'bidirectional',
                    linkDescription,
                    linkedBy: session.user.id,
                    isImmutable: true,
                },
            });
        }

        return NextResponse.json({
            link,
            message: 'Archive link created successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating archive link:', error);
        return NextResponse.json(
            { error: 'Failed to create archive link' },
            { status: 500 }
        );
    }
}

// =============================================================================
// GET - List Links for Organization
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const linkType = searchParams.get('linkType');
        const limit = parseInt(searchParams.get('limit') || '100');

        // Get archive IDs for this organization
        const archiveIds = await (prisma as any).archiveRecord.findMany({
            where: { organizationId: session.user.organizationId },
            select: { id: true },
        });

        const ids = archiveIds.map((a: any) => a.id);

        const where: any = {
            OR: [
                { sourceArchiveId: { in: ids } },
                { targetArchiveId: { in: ids } },
            ],
        };

        if (linkType) where.linkType = linkType;

        const links = await (prisma as any).archiveLink.findMany({
            where,
            orderBy: { linkedAt: 'desc' },
            take: limit,
        });

        return NextResponse.json({ links });
    } catch (error) {
        console.error('Error fetching archive links:', error);
        return NextResponse.json(
            { error: 'Failed to fetch archive links' },
            { status: 500 }
        );
    }
}