// =============================================================================
// DUNNING API - Import Rollback (TS Section 13.4)
// src/app/api/dunning/import/[batchId]/rollback/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    DunningStatus,
    DunningEventType,
    generateEventId,
} from '@/types/dunning';

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
        const body = await request.json();
        const { reason } = body;

        if (!reason?.trim()) {
            return NextResponse.json(
                { error: 'Rollback reason is required' },
                { status: 400 }
            );
        }

        // Find batch
        const batch = await (prisma as any).dunningImportBatch.findFirst({
            where: {
                organizationId: session.user.organizationId,
                OR: [
                    { id: batchId },
                    { batchNumber: batchId },
                ],
            },
        });

        if (!batch) {
            return NextResponse.json({ error: 'Import batch not found' }, { status: 404 });
        }

        // Validate can rollback
        if (!batch.canRollback) {
            return NextResponse.json(
                {
                    error: 'This batch cannot be rolled back',
                    code: 'ROLLBACK_NOT_ALLOWED',
                },
                { status: 400 }
            );
        }

        if (batch.status === 'rolled_back') {
            return NextResponse.json(
                {
                    error: 'This batch has already been rolled back',
                    code: 'ALREADY_ROLLED_BACK',
                },
                { status: 400 }
            );
        }

        const now = new Date();
        const createdDunningIds = batch.createdDunningIds || [];

        if (createdDunningIds.length === 0) {
            return NextResponse.json(
                {
                    error: 'No dunning records to rollback',
                    code: 'NOTHING_TO_ROLLBACK',
                },
                { status: 400 }
            );
        }

        // Check if any dunnings have been modified
        const modifiedDunnings = await (prisma as any).dunning.findMany({
            where: {
                id: { in: createdDunningIds },
                OR: [
                    { status: { notIn: [DunningStatus.ISSUED, DunningStatus.DUE, DunningStatus.OVERDUE] } },
                    { eventCount: { gt: 1 } },
                ],
            },
            select: { id: true, dunningId: true, dunningNumber: true, status: true, eventCount: true },
        });

        if (modifiedDunnings.length > 0) {
            return NextResponse.json(
                {
                    error: 'Some dunning records have been modified and cannot be rolled back',
                    code: 'MODIFIED_RECORDS',
                    modifiedRecords: modifiedDunnings.map((d: any) => ({
                        dunningId: d.dunningId,
                        dunningNumber: d.dunningNumber,
                        status: d.status,
                        eventCount: d.eventCount,
                    })),
                },
                { status: 400 }
            );
        }

        // Perform rollback
        const rolledBack: string[] = [];
        const failed: any[] = [];

        for (const dunningId of createdDunningIds) {
            try {
                const dunning = await (prisma as any).dunning.findUnique({
                    where: { id: dunningId },
                });

                if (!dunning) {
                    failed.push({ id: dunningId, reason: 'Not found' });
                    continue;
                }

                // Create rollback event before deletion
                const eventId = generateEventId(dunning.dunningId, DunningEventType.DUNNING_REVERSED, now);

                await (prisma as any).dunningEvent.create({
                    data: {
                        eventId,
                        dunningId: dunning.id,
                        eventType: DunningEventType.DUNNING_REVERSED,
                        timestamp: now,
                        actorId: session.user.id,
                        actorName: session.user.name || session.user.email,
                        actorType: 'user',
                        payload: {
                            rollbackBatch: batch.batchNumber,
                            reason,
                            originalRecord: dunning,
                        },
                        explanation: `Rolled back as part of import batch ${batch.batchNumber} rollback. Reason: ${reason}`,
                    },
                });

                // Soft delete by marking as rolled back (maintain audit trail)
                await (prisma as any).dunning.update({
                    where: { id: dunningId },
                    data: {
                        status: 'rolled_back',
                        archivedAt: now,
                        archivedBy: session.user.id,
                        archiveReason: `Import rollback: ${reason}`,
                        systemTags: [...(dunning.systemTags || []), 'rolled_back', `rollback:${batch.batchNumber}`],
                    },
                });

                rolledBack.push(dunning.dunningId);
            } catch (err: any) {
                failed.push({ id: dunningId, reason: err.message });
            }
        }

        // Update batch
        await (prisma as any).dunningImportBatch.update({
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
            rolledBack: rolledBack.length,
            failed: failed.length,
            total: createdDunningIds.length,
            rolledBackIds: rolledBack,
            failedRecords: failed.length > 0 ? failed : undefined,
            message: `Rollback completed. ${rolledBack.length}/${createdDunningIds.length} records rolled back.`,
        });
    } catch (error) {
        console.error('Error rolling back import:', error);
        return NextResponse.json(
            { error: 'Failed to rollback import' },
            { status: 500 }
        );
    }
}