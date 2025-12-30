// =============================================================================
// ARCHIVE API - Single Record Route
// src/app/api/archive/[id]/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// GET - Get Single Archive Record (with optional includes)
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
    const { searchParams } = new URL(request.url);

    // Include options
    const includeLinks = searchParams.get('includeLinks') === 'true';
    const includeVersions = searchParams.get('includeVersions') === 'true';
    const includeAccessLogs = searchParams.get('includeAccessLogs') === 'true';
    const includeLineage = searchParams.get('includeLineage') === 'true';

    // Fetch record
    const record = await (prisma as any).archiveRecord.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'Archive record not found' }, { status: 404 });
    }

    // Verify integrity (TS Section 4.3)
    // In production, would re-hash content and compare
    const integrityValid = record.integrityVerified;

    // Fetch related data
    let links: any[] = [];
    let linkedBy: any[] = [];
    let versions: any[] = [];
    let accessLogs: any[] = [];
    let lineage: any = null;

    if (includeLinks) {
      [links, linkedBy] = await Promise.all([
        (prisma as any).archiveLink.findMany({
          where: { sourceArchiveId: id },
        }),
        (prisma as any).archiveLink.findMany({
          where: { targetArchiveId: id },
        }),
      ]);
    }

    if (includeVersions) {
      versions = await (prisma as any).archiveVersion.findMany({
        where: { archiveRecordId: id },
        orderBy: { versionNumber: 'desc' },
      });
    }

    if (includeAccessLogs) {
      accessLogs = await (prisma as any).archiveAccessLog.findMany({
        where: { archiveRecordId: id },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });
    }

    if (includeLineage) {
      lineage = await buildLineageGraph(id, session.user.organizationId);
    }

    // Update access count and log
    await (prisma as any).archiveRecord.update({
      where: { id },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
        lastAccessedBy: session.user.id,
        status: 'accessed',
      },
    });

    // Log access
    await (prisma as any).archiveAccessLog.create({
      data: {
        archiveRecordId: id,
        accessType: 'view',
        accessScope: 'full',
        actorId: session.user.id,
        actorName: session.user.name || session.user.email,
        actorType: 'user',
        accessGranted: true,
      },
    });

    return NextResponse.json({
      record: {
        ...record,
        amount: record.amount ? Number(record.amount) : null,
        fxRateAtArchive: record.fxRateAtArchive ? Number(record.fxRateAtArchive) : null,
        amountInReporting: record.amountInReporting ? Number(record.amountInReporting) : null,
        confidenceScore: Number(record.confidenceScore),
        integrityValid,
      },
      links,
      linkedBy,
      versions,
      accessLogs,
      lineage,
    });
  } catch (error) {
    console.error('Error fetching archive record:', error);
    return NextResponse.json(
        { error: 'Failed to fetch archive record' },
        { status: 500 }
    );
  }
}

// =============================================================================
// NO PATCH/PUT - Archives are IMMUTABLE (TS Section 19)
// =============================================================================

export async function PATCH() {
  return NextResponse.json(
      {
        error: 'Archive records are immutable and cannot be modified',
        code: 'ARCHIVE_IMMUTABLE',
      },
      { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
      {
        error: 'Archive records are immutable and cannot be modified',
        code: 'ARCHIVE_IMMUTABLE',
      },
      { status: 405 }
  );
}

// =============================================================================
// NO DELETE - Archives cannot be deleted (TS Section 11.2)
// =============================================================================

export async function DELETE() {
  return NextResponse.json(
      {
        error: 'Archive records cannot be deleted. Only legal-mandated deletion is allowed via administrative process.',
        code: 'ARCHIVE_PERMANENT',
      },
      { status: 405 }
  );
}

// =============================================================================
// HELPER: Build Lineage Graph (TS Section 5, 12)
// =============================================================================

async function buildLineageGraph(archiveId: string, organizationId: string) {
  const visited = new Set<string>();
  const nodes: any[] = [];
  const edges: any[] = [];

  async function traverse(id: string, depth: number = 0) {
    if (visited.has(id) || depth > 10) return;
    visited.add(id);

    const record = await (prisma as any).archiveRecord.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        archiveRecordId: true,
        objectType: true,
        title: true,
        archivedAt: true,
      },
    });

    if (!record) return;

    nodes.push({
      id: record.id,
      archiveRecordId: record.archiveRecordId,
      objectType: record.objectType,
      title: record.title,
      archivedAt: record.archivedAt,
      depth,
    });

    // Get outbound links
    const outboundLinks = await (prisma as any).archiveLink.findMany({
      where: { sourceArchiveId: id },
    });

    for (const link of outboundLinks) {
      edges.push({
        sourceId: id,
        targetId: link.targetArchiveId,
        linkType: link.linkType,
        direction: 'outbound',
      });
      await traverse(link.targetArchiveId, depth + 1);
    }

    // Get inbound links
    const inboundLinks = await (prisma as any).archiveLink.findMany({
      where: { targetArchiveId: id },
    });

    for (const link of inboundLinks) {
      edges.push({
        sourceId: link.sourceArchiveId,
        targetId: id,
        linkType: link.linkType,
        direction: 'inbound',
      });
      await traverse(link.sourceArchiveId, depth + 1);
    }
  }

  await traverse(archiveId);

  return {
    rootId: archiveId,
    nodes,
    edges,
    nodeCount: nodes.length,
    edgeCount: edges.length,
  };
}