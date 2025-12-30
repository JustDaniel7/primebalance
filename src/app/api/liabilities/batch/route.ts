// =============================================================================
// LIABILITIES API - Batch Operations (TS Section 17)
// src/app/api/liabilities/batch/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    LiabilityStatus,
    LiabilityEventType,
    canTransitionTo,
} from '@/types/liabilities';

// =============================================================================
// POST - Batch Operations
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { operation, liabilityIds, params = {} } = body;

        // Validate
        if (!operation) {
            return NextResponse.json({ error: 'Operation is required' }, { status: 400 });
        }
        if (!liabilityIds || !Array.isArray(liabilityIds) || liabilityIds.length === 0) {
            return NextResponse.json({ error: 'liabilityIds array is required' }, { status: 400 });
        }

        const validOperations = ['recognize', 'activate', 'archive', 'update_risk', 'update_tags'];
        if (!validOperations.includes(operation)) {
            return NextResponse.json(
                { error: `Invalid operation. Valid operations: ${validOperations.join(', ')}` },
                { status: 400 }
            );
        }

        // Find liabilities
        const liabilities = await (prisma as any).liability.findMany({
            where: {
                organizationId: session.user.organizationId,
                OR: [
                    { id: { in: liabilityIds } },
                    { liabilityId: { in: liabilityIds } },
                ],
            },
        });

        if (liabilities.length === 0) {
            return NextResponse.json({ error: 'No liabilities found' }, { status: 404 });
        }

        const results = {
            total: liabilityIds.length,
            found: liabilities.length,
            processed: 0,
            failed: 0,
            errors: [] as any[],
            processedIds: [] as string[],
        };

        const now = new Date();

        for (const liability of liabilities) {
            try {
                let targetStatus: LiabilityStatus | null = null;
                let eventType: LiabilityEventType | null = null;
                let updateData: any = {};
                let eventPayload: any = {};

                switch (operation) {
                    case 'recognize':
                        targetStatus = LiabilityStatus.RECOGNIZED;
                        eventType = LiabilityEventType.LIABILITY_RECOGNIZED;
                        if (!canTransitionTo(liability.status, targetStatus)) {
                            throw new Error(`Cannot recognize from status '${liability.status}'`);
                        }
                        updateData = {
                            status: targetStatus,
                            previousStatus: liability.status,
                            statusChangedAt: now,
                            statusChangedBy: session.user.id,
                            recognitionDate: now,
                        };
                        eventPayload = { status: targetStatus };
                        break;

                    case 'activate':
                        targetStatus = LiabilityStatus.ACTIVE;
                        eventType = LiabilityEventType.LIABILITY_ACTIVATED;
                        if (!canTransitionTo(liability.status, targetStatus)) {
                            throw new Error(`Cannot activate from status '${liability.status}'`);
                        }
                        updateData = {
                            status: targetStatus,
                            previousStatus: liability.status,
                            statusChangedAt: now,
                            statusChangedBy: session.user.id,
                            activationDate: now,
                        };
                        eventPayload = { status: targetStatus };
                        break;

                    case 'archive':
                        targetStatus = LiabilityStatus.ARCHIVED;
                        eventType = LiabilityEventType.LIABILITY_ARCHIVED;
                        if (!canTransitionTo(liability.status, targetStatus)) {
                            throw new Error(`Cannot archive from status '${liability.status}'`);
                        }
                        updateData = {
                            status: targetStatus,
                            previousStatus: liability.status,
                            statusChangedAt: now,
                            statusChangedBy: session.user.id,
                            archivedAt: now,
                            archivedBy: session.user.id,
                            archiveReason: params.reason || 'Batch archive',
                        };
                        eventPayload = { status: targetStatus, reason: params.reason };
                        break;

                    case 'update_risk':
                        if (!params.riskLevel) {
                            throw new Error('riskLevel parameter is required');
                        }
                        eventType = LiabilityEventType.LIABILITY_AMENDED;
                        updateData = {
                            riskLevel: params.riskLevel,
                        };
                        eventPayload = { riskLevel: params.riskLevel };
                        break;

                    case 'update_tags':
                        if (!params.tags) {
                            throw new Error('tags parameter is required');
                        }
                        eventType = LiabilityEventType.LIABILITY_AMENDED;
                        const currentTags = liability.tags || [];
                        const newTags = params.mode === 'replace'
                            ? params.tags
                            : [...new Set([...currentTags, ...params.tags])];
                        updateData = { tags: newTags };
                        eventPayload = { tags: newTags };
                        break;
                }

                // Update liability
                updateData.version = liability.version + 1;
                updateData.eventCount = liability.eventCount + 1;

                await (prisma as any).liability.update({
                    where: { id: liability.id },
                    data: updateData,
                });

                // Create event
                if (eventType) {
                    const eventId = `evt_${liability.liabilityId}_batch_${now.getTime()}_${results.processed}`;
                    await (prisma as any).liabilityEvent.create({
                        data: {
                            eventId,
                            liabilityId: liability.id,
                            eventType,
                            timestamp: now,
                            actorId: session.user.id,
                            actorName: session.user.name || session.user.email,
                            actorType: 'user',
                            payload: eventPayload,
                            previousState: { status: liability.status },
                            previousEventId: liability.lastEventId,
                            explanation: `Batch operation: ${operation}`,
                        },
                    });

                    await (prisma as any).liability.update({
                        where: { id: liability.id },
                        data: { lastEventId: eventId },
                    });
                }

                results.processed++;
                results.processedIds.push(liability.liabilityId);
            } catch (err: any) {
                results.failed++;
                results.errors.push({
                    liabilityId: liability.liabilityId,
                    error: err.message,
                });
            }
        }

        return NextResponse.json({
            operation,
            results,
            message: `Batch operation '${operation}' completed: ${results.processed} processed, ${results.failed} failed`,
        });
    } catch (error) {
        console.error('Error in batch operation:', error);
        return NextResponse.json(
            { error: 'Failed to execute batch operation' },
            { status: 500 }
        );
    }
}