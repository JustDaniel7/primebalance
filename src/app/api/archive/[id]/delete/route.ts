// =============================================================================
// ARCHIVE API - Delete Route (Soft Delete / Mark for Deletion)
// src/app/api/archive/[id]/delete/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Default warning period in days before permanent deletion
const DEFAULT_WARNING_PERIOD_DAYS = 30;

// =============================================================================
// POST - Mark Archive for Deletion (Soft Delete with Warning Period)
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
    const body = await request.json().catch(() => ({}));
    const warningPeriodDays = body.warningPeriodDays || DEFAULT_WARNING_PERIOD_DAYS;
    const reason = body.reason || 'User requested deletion';

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

    // Calculate permanent deletion date (after warning period)
    const now = new Date();
    const permanentDeletionDate = new Date(now);
    permanentDeletionDate.setDate(permanentDeletionDate.getDate() + warningPeriodDays);

    // Soft delete by updating status with warning period
    const updated = await (prisma as any).archiveRecord.update({
      where: { id },
      data: {
        status: 'pending_deletion',
        deletionScheduledAt: now,
        permanentDeletionDate: permanentDeletionDate,
        deletionReason: reason,
        deletionRequestedBy: session.user.id,
        lastAccessedAt: now,
        lastAccessedBy: session.user.id,
      },
    });

    // Log the delete action
    await (prisma as any).archiveAccessLog.create({
      data: {
        archiveRecordId: id,
        accessType: 'schedule_delete',
        accessScope: 'full',
        actorId: session.user.id,
        actorName: session.user.name || session.user.email,
        actorType: 'user',
        accessGranted: true,
        context: JSON.stringify({
          reason,
          warningPeriodDays,
          permanentDeletionDate: permanentDeletionDate.toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Archive scheduled for deletion. Will be permanently deleted on ${permanentDeletionDate.toLocaleDateString()}.`,
      deletionScheduledAt: now.toISOString(),
      permanentDeletionDate: permanentDeletionDate.toISOString(),
      warningPeriodDays,
      canCancel: true,
    });
  } catch (error) {
    console.error('Error deleting archive:', error);
    return NextResponse.json(
        { error: 'Failed to delete archive' },
        { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Cancel Scheduled Deletion
// =============================================================================

export async function DELETE(
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

    // Check if record is scheduled for deletion
    if (record.status !== 'pending_deletion') {
      return NextResponse.json({
        error: 'Archive is not scheduled for deletion',
        code: 'NOT_SCHEDULED',
        currentStatus: record.status,
      }, { status: 400 });
    }

    // Cancel scheduled deletion
    await (prisma as any).archiveRecord.update({
      where: { id },
      data: {
        status: 'active',
        deletionScheduledAt: null,
        permanentDeletionDate: null,
        deletionReason: null,
        deletionRequestedBy: null,
        lastAccessedAt: new Date(),
        lastAccessedBy: session.user.id,
      },
    });

    // Log the cancellation
    await (prisma as any).archiveAccessLog.create({
      data: {
        archiveRecordId: id,
        accessType: 'cancel_delete',
        accessScope: 'full',
        actorId: session.user.id,
        actorName: session.user.name || session.user.email,
        actorType: 'user',
        accessGranted: true,
        context: JSON.stringify({
          reason: 'Scheduled deletion cancelled by user',
          previousDeletionDate: record.permanentDeletionDate,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Scheduled deletion has been cancelled',
      status: 'active',
    });
  } catch (error) {
    console.error('Error cancelling archive deletion:', error);
    return NextResponse.json(
        { error: 'Failed to cancel deletion' },
        { status: 500 }
    );
  }
}
