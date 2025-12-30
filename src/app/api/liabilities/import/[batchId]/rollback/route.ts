// =============================================================================
// LIABILITIES API - Import Rollback (TS Section 12.4)
// src/app/api/liabilities/import/[batchId]/rollback/route.ts
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

        // Find batch
        const batch = await (prisma as any).liabilityImportBatch.findFirst({
            where: {
                OR: [
                    { id: batchId },
                    { batchNumber: batchId },
                ],
                organizationId: session.user.organizationId,
            },
        });

        if (!batch) {
            return NextResponse.json({ error: 'Import batch not found' }, { status: 404 });
        }

        // Check if rollback is allowed
        if (!batch.canRollback) {
            return NextResponse.json(
                {
                    error: 'This batch cannot be rolled back',
                    code: 'ROLLBACK_NOT_ALLOWED',
                    status: batch.status,
                },
                { status: 400 }
            );
        }

        if (batch.status === 'rolled_back') {
            return NextResponse.json(
                { error: 'Batch has already been rolled back', code: 'ALREADY_ROLLED_BACK' },
                { status: 400 }
            );
        }

        const now = new Date();
        const liabilityIds = batch.createdLiabilityIds || [];

        if (liabilityIds.length === 0) {
            return NextResponse.json(
                { error: 'No liabilities to rollback', code: 'NOTHING_TO_ROLLBACK' },
                { status: 400 }
            );
        }

        // Find liabilities to delete
        const liabilities = await (prisma as any).liability.findMany({
            where: {
                organizationId: session.user.organizationId,
                liabilityId: { in: liabilityIds },
            },
            select: { id: true, liabilityId: true },
        });

        const dbIds = liabilities.map((l: any) => l.id);

        // Delete in order: events -> accruals -> payments -> settlements -> covenants -> liabilities
        await (prisma as any).liabilityEvent.deleteMany({
            where: { liabilityId: { in: dbIds } },
        });

        await (prisma as any).liabilityAccrual.deleteMany({
            where: { liabilityId: { in: dbIds } },
        });

        await (prisma as any).liabilityPayment.deleteMany({
            where: { liabilityId: { in: dbIds } },
        });

        await (prisma as any).liabilitySettlement.deleteMany({
            where: { liabilityId: { in: dbIds } },
        });

        await (prisma as any).liabilityCovenantCheck.deleteMany({
            where: { liabilityId: { in: dbIds } },
        });

        await (prisma as any).liability.deleteMany({
            where: { id: { in: dbIds } },
        });

        // Update batch
        await (prisma as any).liabilityImportBatch.update({
            where: { id: batch.id },
            data: {
                status: 'rolled_back',
                canRollback: false,
                rolledBackAt: now,
                rolledBackBy: session.user.id,
            },
        });

        return NextResponse.json({
            batchNumber: batch.batchNumber,
            rolledBackCount: liabilities.length,
            rolledBackIds: liabilityIds,
            message: `Rollback complete: ${liabilities.length} liabilities removed`,
        });
    } catch (error) {
        console.error('Error rolling back import:', error);
        return NextResponse.json(
            { error: 'Failed to rollback import' },
            { status: 500 }
        );
    }
}