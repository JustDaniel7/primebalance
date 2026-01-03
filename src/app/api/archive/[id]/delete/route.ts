// =============================================================================
// ARCHIVE API - Delete Route (Soft Delete / Mark for Deletion)
// src/app/api/archive/[id]/delete/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// POST - Mark Archive for Deletion (Soft Delete)
// =============================================================================

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the archive record
    const record = await (prisma as any).archiveRecord.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'Archive record not found' }, { status: 404 });
    }

    // Check if record is on legal hold
    if (record.legalHold) {
      return NextResponse.json({
        error: 'Cannot delete item on legal hold',
        code: 'LEGAL_HOLD_ACTIVE',
      }, { status: 403 });
    }

    // Check retention period
    if (record.retentionEndDate) {
      const retentionEnd = new Date(record.retentionEndDate);
      if (retentionEnd > new Date()) {
        return NextResponse.json({
          error: 'Cannot delete item before retention period ends',
          code: 'RETENTION_ACTIVE',
          retentionEndDate: record.retentionEndDate,
        }, { status: 403 });
      }
    }

    // Soft delete by updating status
    await (prisma as any).archiveRecord.update({
      where: { id },
      data: {
        status: 'deleted',
        deletionScheduledAt: new Date(),
        deletionReason: 'User requested deletion',
        lastAccessedAt: new Date(),
        lastAccessedBy: session.user.id,
      },
    });

    // Log the delete action
    await (prisma as any).archiveAccessLog.create({
      data: {
        archiveRecordId: id,
        accessType: 'delete',
        accessScope: 'full',
        actorId: session.user.id,
        actorName: session.user.name || session.user.email,
        actorType: 'user',
        accessGranted: true,
        context: JSON.stringify({ reason: 'User requested deletion' }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Archive marked for deletion',
    });
  } catch (error) {
    console.error('Error deleting archive:', error);
    return NextResponse.json(
        { error: 'Failed to delete archive' },
        { status: 500 }
    );
  }
}
