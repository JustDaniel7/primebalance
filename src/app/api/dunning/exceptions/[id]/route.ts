// =============================================================================
// DUNNING API - Exception Detail & Resolution (TS Section 9.5)
// src/app/api/dunning/exceptions/[id]/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DunningExceptionStatus } from '@/types/dunning';

// =============================================================================
// GET - Get Exception Detail
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

        const exception = await (prisma as any).dunningException.findFirst({
            where: {
                organizationId: session.user.organizationId,
                id,
            },
            include: {
                dunning: {
                    include: {
                        events: {
                            orderBy: { timestamp: 'desc' },
                            take: 10,
                        },
                        proposals: {
                            orderBy: { proposedAt: 'desc' },
                            take: 5,
                        },
                    },
                },
            },
        });

        if (!exception) {
            return NextResponse.json({ error: 'Exception not found' }, { status: 404 });
        }

        return NextResponse.json({
            exception: {
                ...exception,
                confidenceScore: exception.confidenceScore ? Number(exception.confidenceScore) : null,
            },
        });
    } catch (error) {
        console.error('Error fetching exception:', error);
        return NextResponse.json(
            { error: 'Failed to fetch exception' },
            { status: 500 }
        );
    }
}

// =============================================================================
// PATCH - Update Exception (Assign, Start Work)
// =============================================================================

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { assignTo, status, notes } = body;

        const exception = await (prisma as any).dunningException.findFirst({
            where: {
                organizationId: session.user.organizationId,
                id,
            },
        });

        if (!exception) {
            return NextResponse.json({ error: 'Exception not found' }, { status: 404 });
        }

        const now = new Date();
        const updateData: any = {};

        // Assign
        if (assignTo !== undefined) {
            updateData.assignedTo = assignTo;
            updateData.assignedName = assignTo ? (body.assignedName || session.user.name) : null;
            updateData.assignedAt = assignTo ? now : null;
        }

        // Change status
        if (status) {
            if (status === DunningExceptionStatus.IN_PROGRESS && exception.status === DunningExceptionStatus.OPEN) {
                updateData.status = status;
                if (!updateData.assignedTo) {
                    updateData.assignedTo = session.user.id;
                    updateData.assignedName = session.user.name || session.user.email;
                    updateData.assignedAt = now;
                }
            } else if (status === DunningExceptionStatus.ESCALATED) {
                updateData.status = status;
                updateData.escalationLevel = (exception.escalationLevel || 0) + 1;
                updateData.escalatedAt = now;
                updateData.escalatedTo = body.escalateTo;
            }
        }

        // Update SLA overdue flag
        if (exception.slaDeadline && new Date(exception.slaDeadline) < now) {
            updateData.isOverdue = true;
        }

        const updated = await (prisma as any).dunningException.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            exception: {
                ...updated,
                confidenceScore: updated.confidenceScore ? Number(updated.confidenceScore) : null,
            },
            message: status
                ? `Exception status changed to ${status}`
                : assignTo
                    ? `Exception assigned to ${updateData.assignedName}`
                    : 'Exception updated',
        });
    } catch (error) {
        console.error('Error updating exception:', error);
        return NextResponse.json(
            { error: 'Failed to update exception' },
            { status: 500 }
        );
    }
}

// =============================================================================
// POST - Resolve Exception
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
        const body = await request.json();
        const {
            resolution,
            resolutionAction, // 'processed' | 'skipped' | 'corrected' | 'manual_override'
        } = body;

        if (!resolution?.trim()) {
            return NextResponse.json(
                { error: 'Resolution description is required' },
                { status: 400 }
            );
        }

        if (!resolutionAction) {
            return NextResponse.json(
                { error: 'Resolution action is required' },
                { status: 400 }
            );
        }

        const validActions = ['processed', 'skipped', 'corrected', 'manual_override'];
        if (!validActions.includes(resolutionAction)) {
            return NextResponse.json(
                { error: 'Invalid resolution action', validActions },
                { status: 400 }
            );
        }

        const exception = await (prisma as any).dunningException.findFirst({
            where: {
                organizationId: session.user.organizationId,
                id,
            },
        });

        if (!exception) {
            return NextResponse.json({ error: 'Exception not found' }, { status: 404 });
        }

        if (exception.status === DunningExceptionStatus.RESOLVED) {
            return NextResponse.json(
                { error: 'Exception is already resolved' },
                { status: 400 }
            );
        }

        const now = new Date();

        // Update exception
        const updated = await (prisma as any).dunningException.update({
            where: { id },
            data: {
                status: DunningExceptionStatus.RESOLVED,
                resolvedAt: now,
                resolvedBy: session.user.id,
                resolution,
                resolutionAction,
            },
        });

        // If resolved with 'processed', update the related dunning
        if (resolutionAction === 'processed' && exception.dunningId) {
            await (prisma as any).dunning.update({
                where: { id: exception.dunningId },
                data: {
                    verificationStatus: 'verified',
                    confidenceScore: 1.0,
                },
            });
        }

        return NextResponse.json({
            exception: {
                ...updated,
                confidenceScore: updated.confidenceScore ? Number(updated.confidenceScore) : null,
            },
            message: `Exception resolved with action: ${resolutionAction}`,
        });
    } catch (error) {
        console.error('Error resolving exception:', error);
        return NextResponse.json(
            { error: 'Failed to resolve exception' },
            { status: 500 }
        );
    }
}