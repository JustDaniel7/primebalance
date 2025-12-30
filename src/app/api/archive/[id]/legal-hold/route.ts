// =============================================================================
// ARCHIVE API - Legal Hold Management
// src/app/api/archive/[id]/legal-hold/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// POST - Set Legal Hold (TS Section 7.2)
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
        const { reason } = body;

        if (!reason?.trim()) {
            return NextResponse.json(
                { error: 'Legal hold reason is required' },
                { status: 400 }
            );
        }

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

        if (record.legalHold) {
            return NextResponse.json(
                {
                    error: 'Archive record is already on legal hold',
                    existingReason: record.legalHoldReason,
                    existingHoldBy: record.legalHoldBy,
                    existingHoldAt: record.legalHoldAt,
                },
                { status: 409 }
            );
        }

        // Set legal hold
        const updated = await (prisma as any).archiveRecord.update({
            where: { id },
            data: {
                legalHold: true,
                legalHoldReason: reason,
                legalHoldBy: session.user.id,
                legalHoldAt: new Date(),
                retentionStatus: 'legal_hold',
                status: 'legal_hold',
            },
        });

        // Log access
        await (prisma as any).archiveAccessLog.create({
            data: {
                archiveRecordId: id,
                accessType: 'view',
                accessReason: `Legal hold set: ${reason}`,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                accessGranted: true,
            },
        });

        return NextResponse.json({
            record: updated,
            message: 'Legal hold applied successfully',
        });
    } catch (error) {
        console.error('Error setting legal hold:', error);
        return NextResponse.json(
            { error: 'Failed to set legal hold' },
            { status: 500 }
        );
    }
}

// =============================================================================
// DELETE - Remove Legal Hold (requires elevated permissions)
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
        const body = await request.json();
        const { reason, approvedBy } = body;

        if (!reason?.trim()) {
            return NextResponse.json(
                { error: 'Removal reason is required' },
                { status: 400 }
            );
        }

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

        if (!record.legalHold) {
            return NextResponse.json(
                { error: 'Archive record is not on legal hold' },
                { status: 400 }
            );
        }

        // Remove legal hold
        const updated = await (prisma as any).archiveRecord.update({
            where: { id },
            data: {
                legalHold: false,
                retentionStatus: 'active',
                status: 'archived',
                // Keep legalHoldReason, legalHoldBy, legalHoldAt for audit trail
            },
        });

        // Log access
        await (prisma as any).archiveAccessLog.create({
            data: {
                archiveRecordId: id,
                accessType: 'view',
                accessReason: `Legal hold removed: ${reason}. Approved by: ${approvedBy || session.user.id}`,
                actorId: session.user.id,
                actorName: session.user.name || session.user.email,
                actorType: 'user',
                accessGranted: true,
            },
        });

        return NextResponse.json({
            record: updated,
            message: 'Legal hold removed successfully',
        });
    } catch (error) {
        console.error('Error removing legal hold:', error);
        return NextResponse.json(
            { error: 'Failed to remove legal hold' },
            { status: 500 }
        );
    }
}