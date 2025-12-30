// =============================================================================
// ARCHIVE API - Import Rollback (TS Section 10.4)
// src/app/api/archive/import/[batchId]/rollback/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// POST - Rollback Import Batch
// =============================================================================

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ batchId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { batchId } = await params;

        // Find import batch
        const batch = await (prisma as any).archiveImportBatch.findFirst({
            where: {
                id: batchId,
                organizationId: session.user.organizationId,
            },
        });

        if (!batch) {
            return NextResponse.json({ error: 'Import batch not found' }, { status: 404 });
        }

        if (!batch.canRollback) {
            return NextResponse.json(
                { error: 'This import batch cannot be rolled back' },
                { status: 400 }
            );
        }

        if (batch.status === 'rolled_back') {
            return NextResponse.json(
                { error: 'This import batch has already been rolled back' },
                { status: 400 }
            );
        }

        // Delete all records created by this batch
        // Note: In production, this would be a soft delete preserving audit trail
        const deleteResult = await (prisma as any).archiveRecord.deleteMany({
            where: {
                importBatchId: batchId,
                organizationId: session.user.organizationId,
            },
        });

        // Update batch status
        await (prisma as any).archiveImportBatch.update({
            where: { id: batchId },
            data: {
                status: 'rolled_back',
                rolledBackAt: new Date(),
                rolledBackBy: session.user.id,
                canRollback: false,
            },
        });

        return NextResponse.json({
            batchId,
            batchNumber: batch.batchNumber,
            recordsDeleted: deleteResult.count,
            rolledBackAt: new Date().toISOString(),
            message: `Import batch rolled back. ${deleteResult.count} records removed.`,
        });
    } catch (error) {
        console.error('Error rolling back import:', error);
        return NextResponse.json(
            { error: 'Failed to rollback import' },
            { status: 500 }
        );
    }
}